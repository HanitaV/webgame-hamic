#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_levels.py - Sinh nội dung tự động cho "Hội tụ 70" với kiểm chứng kép (bản 2.3).

Nguyen tac:
  1. Moi dap an duoc tinh bang it nhat HAI phuong phap doc lap (cong thuc va duyet/mo phong).
  2. Instance nao hai phuong phap khong khop se bi LOAI (khong bao gio dua vao game).
  3. Van ban (de bai, goi y) sinh tu khuon mau co chen so tinh duoc, roi qua bo loc tu ngu.
  4. verify_core() kiem lai moi dap an viet tay trong GDD.
  5. (2.3) Van ban co dau day du; lop "Dao choi" (casual) cho 5 dang, qua bo quet muc de doc.

Chay:  python3 gen_levels.py [--per-cell 6] [--out .]
"""
import argparse
import hashlib
import heapq
import itertools
import json
import math
import os
import random
import re
import sys
from collections import Counter
from fractions import Fraction

# ----------------------------------------------------------------------------
# Tien ich dinh dang
# ----------------------------------------------------------------------------


def num(x):
    if isinstance(x, Fraction):
        return str(x.numerator) if x.denominator == 1 else "%d/%d" % (x.numerator, x.denominator)
    if isinstance(x, float):
        if abs(x - round(x)) < 1e-9:
            return str(int(round(x)))
        return ("%.4f" % x).rstrip("0").rstrip(".").replace(".", ",")
    return str(x)


def term(coef, var, first=False):
    if coef == 0:
        return ""
    a = abs(coef)
    body = (str(a) if (a != 1 or var == "") else "") + var
    if first:
        return ("" if coef > 0 else "−") + body
    return (" + " if coef > 0 else " − ") + body


def factor(d):
    if d == 0:
        return "x"
    return "(x %s %d)" % ("+" if d > 0 else "−", abs(d))


def mk(module, diff, seed, prompt, data, answer, checks, hints, stars=None):
    return {
        "id": "%s-d%d-s%d" % (module, diff, seed),
        "module": module,
        "difficulty": diff,
        "seed": seed,
        "prompt": prompt,
        "data": data,
        "answer": answer,
        "checks": checks,
        "hints": hints,
        "stars": stars or {},
    }


# ----------------------------------------------------------------------------
# MACH 1 - Giai tich
# ----------------------------------------------------------------------------


def g_plot_limit(seed, diff):
    r = random.Random(seed)
    a = r.choice([30, 40, 50, 60, 70, 70, 80, 90, 100])
    T = r.choice([2, 3, 4, 5])
    eps = {1: 1.0, 2: 0.5, 3: 0.5, 4: 0.25, 5: 0.1}[diff]
    step = 0.05
    b_min = math.log(a / eps) / T
    k = math.ceil(b_min / step - 1e-9)
    b = round(k * step, 2)
    # phuong phap 2: quet luoi
    bb = step
    while a * math.exp(-bb * T) > eps:
        bb = round(bb + step, 2)
    assert bb == b, "quet luoi khong khop"
    assert a * math.exp(-b * T) <= eps < a * math.exp(-round(b - step, 2) * T)
    prompt = ("Pháo hoa phải dừng ở %s m. Với h(t) = a·(1 − e^(−bt)), chọn a và b để sau %d s "
              "độ cao cách %s m không quá %s m." % (a, T, a, num(eps)))
    hints = [
        "Giới hạn của h(t) khi t → ∞ bằng a.",
        "Muốn dừng ở %s m thì a = %s. Sai số sau %d giây là %s·e^(−%d·b)." % (a, a, T, a, T),
        "Cần %s·e^(−%d·b) ≤ %s, tức b ≥ ln(%s)/%d ≈ %s. Bước chỉnh là 0,05 nên b nhỏ nhất là %s."
        % (a, T, num(eps), num(a / eps), T, num(round(b_min, 3)), num(b)),
    ]
    return mk("plot-limit", diff, seed, prompt,
              {"a_range": [0, 100], "b_step": step, "T": T, "eps": eps, "target": a},
              {"a": a, "b_min": b},
              ["công thức ln + làm tròn lên == quét lưới", "sai số đạt tại b, vượt tại b − 0,05"],
              hints, {"star1": {"limit": a}, "star2": {"at": T, "maxError": eps}})


def g_series(seed, diff):
    r = random.Random(seed)
    qs = {1: [Fraction(1, 2)], 2: [Fraction(1, 2), Fraction(1, 3)],
          3: [Fraction(1, 3), Fraction(2, 3)], 4: [Fraction(2, 3), Fraction(3, 4)],
          5: [Fraction(3, 4), Fraction(4, 5), Fraction(5, 6)]}[diff]
    q = r.choice(qs)
    p = r.choice([Fraction(9, 10), Fraction(95, 100), Fraction(99, 100), Fraction(999, 1000)])
    limit = q / (1 - q)
    theta = p * limit
    s, N, pw = Fraction(0), 0, Fraction(1)
    while s < theta:
        N += 1
        pw *= q
        s += pw
    M, pw2 = 0, Fraction(1)
    while pw2 > 1 - p:
        M += 1
        pw2 *= q
    assert N == M, "tong dan va luy thua khong khop"
    n_float = math.ceil(math.log(float(1 - p)) / math.log(float(q)))
    assert abs(n_float - N) <= 1
    prompt = ("Đèn thứ n có độ sáng (%s)^n. Cần bật ít nhất bao nhiêu đèn đầu tiên để tổng đạt %s%% "
              "giá trị tối đa mà tổng có thể tiến tới (%s)?" % (num(q), num(float(p * 100)), num(limit)))
    hints = [
        "Tổng của N đèn đầu là q(1 − q^N)/(1 − q) với q = %s." % num(q),
        "Giá trị tối đa là q/(1 − q) = %s; cần 1 − q^N ≥ %s." % (num(limit), num(float(p))),
        "Cần q^N ≤ %s; thử N tăng dần, kết quả nhỏ nhất là N = %d." % (num(float(1 - p)), N),
    ]
    return mk("series", diff, seed, prompt, {"q": num(q), "percent": float(p * 100)}, {"N": N},
              ["cộng dồn chính xác (phân số) == lũy thừa q^N ≤ 1 − p", "công thức log lệch không quá 1"],
              hints)


def g_removable(seed, diff):
    r = random.Random(seed)
    lo, hi = {1: (1, 5), 2: (1, 9), 3: (-9, 9), 4: (-12, 12), 5: (-20, 20)}[diff]
    c = 0
    while c == 0:
        c = r.randint(lo, hi)
    d = r.randint(-9, 9)
    B, C = d - c, -c * d
    q1 = 1
    q0 = B + c * q1
    rem = C + c * q0
    assert q0 == d and rem == 0, "chia tong hop khong du"
    L = c + d
    f = lambda x: (x * x + B * x + C) / (x - c)
    assert abs(f(c + 1e-6) - L) < 1e-3 and abs(f(c - 1e-6) - L) < 1e-3
    numer = "x²" + term(B, "x") + term(C, "")
    denom = "x − %d" % c if c > 0 else "x + %d" % (-c)
    prompt = ("f(x) = (%s)/(%s) có điểm tối tại x = %d. Chọn giá trị f(%d) để đường sáng liền mạch."
              % (numer, denom, c, c))
    hints = [
        "Mẫu số bằng 0 tại x = %d; thử phân tích tử số thành tích." % c,
        "Tử số = %s·%s." % ((("(x − %d)" % c) if c > 0 else ("(x + %d)" % -c)), factor(d)),
        "Với x ≠ %d, f(x) = %s, nên giới hạn khi x → %d là %d." % (c, "x" if d == 0 else "x %s %d" % ("+" if d > 0 else "−", abs(d)), c, L),
    ]
    return mk("removable", diff, seed, prompt, {"c": c, "numerator": [1, B, C]}, {"value": L},
              ["chia Horner dư 0, thương x + d", "giá trị số tại c ± 1e-6 gần c + d"], hints)


def _num_limit(f):
    f1, f2 = f(1e7), f(1e8)
    if abs(f2) > 1e5 and abs(f2) > abs(f1):
        return "inf"
    n = 10 ** 6
    if abs(f(2 * math.pi * n) - f(2 * math.pi * n + math.pi / 2)) > 0.5:
        return "dne"
    if abs(f1 - f2) < 1e-3:
        return round(f2, 2)
    return "unknown"


def _templates(a, k, b):
    return [
        ("%dx/(x + %d)" % (a, k), lambda x: a * x / (x + k), a, "ok"),
        ("%d(1 − e^(−x))" % a, lambda x: a * (1 - math.exp(-x)), a, "ok"),
        ("%d + 1/x" % a, lambda x: a + 1 / x, a, "ok"),
        ("%d + sin(x)/x" % a, lambda x: a + math.sin(x) / x, a, "ok"),
        ("(%dx² + 1)/(x² + %d)" % (a, k), lambda x: (a * x * x + 1) / (x * x + k), a, "ok"),
        ("%dx/(x + %d)" % (b, k), lambda x: b * x / (x + k), b, "near"),
        ("%d(1 − e^(−x))" % b, lambda x: b * (1 - math.exp(-x)), b, "near"),
        ("%dx" % a, lambda x: a * x, "inf", "far"),
        ("%d·sin x" % a, lambda x: a * math.sin(x), "dne", "far"),
        ("%d/x" % a, lambda x: a / x, 0.0, "far"),
        ("%d + x" % a, lambda x: a + x, "inf", "far"),
        ("%dx/(x² + 1)" % a, lambda x: a * x / (x * x + 1), 0.0, "far"),
    ]


def g_pick_limit(seed, diff):
    r = random.Random(seed)
    a = r.choice([30, 40, 50, 60, 70, 70, 80, 90])
    b = a + r.choice([-10, 10, 20])
    k = r.choice([1, 2, 3, 5])
    T = _templates(a, k, b)
    good = [t for t in T if t[3] == "ok"]
    near = [t for t in T if t[3] == "near"]
    far = [t for t in T if t[3] == "far"]
    nc = r.choice([2, 3])
    chosen = r.sample(good, nc)
    nn = 1 if diff >= 3 else 0
    chosen += r.sample(near, nn)
    chosen += r.sample(far, 5 - len(chosen))
    r.shuffle(chosen)
    labels = []
    correct = []
    for i, (txt, f, declared, kind) in enumerate(chosen):
        nl = _num_limit(f)
        if isinstance(declared, str):
            assert nl == declared, "phan loai so khac khai bao: %s" % txt
        else:
            assert isinstance(nl, float) and abs(nl - declared) < 1e-2, "gioi han so khac khai bao: %s" % txt
        if isinstance(nl, float) and abs(nl - a) < 1e-2:
            correct.append("ABCDE"[i])
        labels.append({"label": "ABCDE"[i], "f": txt, "limit": declared})
    prompt = "Chọn tất cả hàm có giới hạn bằng %d khi x → ∞." % a
    hints = [
        "Giới hạn hữu hạn khác với tiến tới vô cực và khác với không tồn tại.",
        "Hàm dao động (sin) không có giới hạn; hàm tăng không bị chặn thì tiến tới vô cực.",
        "Đáp án đúng: %s." % ", ".join(correct),
    ]
    return mk("pick-limit", diff, seed, prompt, {"options": labels, "target": a}, {"correct": correct},
              ["khai báo == phân loại số (x = 1e7, 1e8; dao động tại 2πn và 2πn + π/2)"], hints)


# ----------------------------------------------------------------------------
# MACH 2 - Dai so tuyen tinh
# ----------------------------------------------------------------------------

MATS = {"R90": ((0, -1), (1, 0)), "R180": ((-1, 0), (0, -1)), "R270": ((0, 1), (-1, 0)),
        "FX": ((1, 0), (0, -1)), "FY": ((-1, 0), (0, 1)), "FD": ((0, 1), (1, 0)), "FA": ((0, -1), (-1, 0))}
VN_NAMES = {"R90": "Xoay 90°", "R180": "Xoay 180°", "R270": "Xoay 270°",
            "FX": "Đối xứng qua trục x", "FY": "Đối xứng qua trục y",
            "FD": "Đối xứng qua y = x", "FA": "Đối xứng qua y = −x"}
# Ten goi cho che do Dao choi: khong dung thuat ngu.
CASUAL_MIRROR = {"R90": "quay trái một góc vuông", "R180": "quay nửa vòng", "R270": "quay phải một góc vuông",
                 "FX": "lật trên dưới", "FY": "lật trái phải",
                 "FD": "lật theo đường chéo lên", "FA": "lật theo đường chéo xuống"}


def mv(M, v):
    return (M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1])


def mm(A, B):
    return tuple(tuple(sum(A[i][k] * B[k][j] for k in range(2)) for j in range(2)) for i in range(2))


def g_beam_order(seed, diff):
    r = random.Random(seed)
    cnt = 2 if diff <= 2 else 3
    for attempt in range(60):
        names = r.sample(sorted(MATS), cnt)
        p, q = r.randint(1, 6), r.randint(1, 6)
        if p == q:
            continue
        v = (p, q)
        t = v
        for nm in names:
            t = mv(MATS[nm], t)
        M = ((1, 0), (0, 1))
        for nm in names:
            M = mm(MATS[nm], M)
        assert mv(M, v) == t, "tich ma tran khac ap dung lan luot"
        sols = []
        for perm in itertools.permutations(names):
            u = v
            for nm in perm:
                u = mv(MATS[nm], u)
            if u == t:
                sols.append(list(perm))
        assert list(names) in sols
        order_matters = len(sols) < math.factorial(cnt)
        if diff >= 2 and not order_matters:
            continue
        shown = names[:]
        r.shuffle(shown)
        prompt = ("Tia đi vào theo hướng (%d, %d) cần ra theo hướng (%d, %d). Đặt %d gương theo đúng thứ tự."
                  % (v[0], v[1], t[0], t[1], cnt))
        hints = [
            "Gương đặt trước tác dụng trước; phép nhân ma trận không giao hoán.",
            "Thử từng thứ tự và xem tia ra ở đâu.",
            "Thứ tự đúng: %s." % " → ".join(VN_NAMES[n] for n in names),
        ]
        return mk("beam-order", diff, seed, prompt,
                  {"vector": list(v), "target": list(t), "mirrors": shown},
                  {"orders": sols, "orderMatters": order_matters},
                  ["tích ma trận == áp dụng tuần tự", "liệt kê mọi hoán vị"], hints)
    raise AssertionError("khong tim duoc instance thoa dieu kien")


TRIPLES = [(3, 4, 5), (5, 12, 13), (8, 15, 17), (7, 24, 25)]


def _det(M):
    return M[0][0] * M[1][1] - M[0][1] * M[1][0]


def _mmF(A, B):
    return tuple(tuple(sum(A[i][k] * B[k][j] for k in range(2)) for j in range(2)) for i in range(2))


def g_transpose_bug(seed, diff):
    r = random.Random(seed)
    a, b, h = r.choice(TRIPLES)
    R = ((Fraction(a, h), Fraction(-b, h)), (Fraction(b, h), Fraction(a, h)))
    Rt = ((R[0][0], R[1][0]), (R[0][1], R[1][1]))
    I = ((1, 0), (0, 1))
    assert _det(R) == 1 and _mmF(Rt, R) == I and _mmF(R, Rt) == I
    inv = ((R[1][1], -R[0][1]), (-R[1][0], R[0][0]))
    assert inv == Rt, "nghich dao khac chuyen vi"
    scale = r.choice([2, 3, 7, 10, 70])
    S = tuple(tuple(scale * x for x in row) for row in R)
    assert _det(S) == scale ** 2 and _det(S) != 1
    k0 = r.randint(1, 3)
    d = (h * k0, 0)
    up = mv(R, d)
    down = mv(Rt, d)
    assert up[1] > 0 and down[1] < 0 and up[0] == down[0]
    prompt = ("Ma trận xoay R = [[%d/%d, −%d/%d], [%d/%d, %d/%d]]. Tia (%d, 0) cần hướng lên. "
              "Nếu hệ thống áp nhầm Rᵀ thay cho R thì tia tới đâu? Nhân cả ma trận lên %d lần có phải cách sửa không?"
              % (a, h, b, h, b, h, a, h, d[0], scale))
    hints = [
        "Với ma trận xoay, Rᵀ chính là nghịch đảo của R.",
        "Áp Rᵀ là xoay ngược chiều nên tia đi xuống; kiểm tra R·d và Rᵀ·d.",
        "R·d = (%s, %s) hướng lên; Rᵀ·d = (%s, %s) hướng xuống; det(%d·R) = %d ≠ 1 nên không còn là phép xoay."
        % (num(up[0]), num(up[1]), num(down[0]), num(down[1]), scale, scale ** 2),
    ]
    return mk("transpose-bug", diff, seed, prompt, {"triple": [a, b, h], "d": list(d), "scale": scale},
              {"up": [num(up[0]), num(up[1])], "down": [num(down[0]), num(down[1])],
               "detScaled": scale ** 2, "scalingFixes": False},
              ["det R = 1, RᵀR = I", "nghịch đảo (công thức phần phụ) == chuyển vị", "dấu y của R·d và Rᵀ·d trái nhau"],
              hints)


# ----------------------------------------------------------------------------
# MACH 3 - Lap trinh (VM khoi lenh)
# ----------------------------------------------------------------------------


def ev(e, env):
    t = e[0]
    if t == "int":
        return e[1]
    if t == "var":
        return env[e[1]]
    if t == "add":
        return ev(e[1], env) + ev(e[2], env)
    if t == "mul":
        return ev(e[1], env) * ev(e[2], env)
    raise ValueError(t)


def run(prog, limit=3_000_000):
    env = {}
    steps = [0]

    def block(ops):
        for op in ops:
            steps[0] += 1
            assert steps[0] < limit, "vuot gioi han buoc"
            k = op[0]
            if k == "set":
                env[op[1]] = ev(op[2], env)
            elif k == "add_to":
                env[op[1]] = env[op[1]] + ev(op[2], env)
            elif k == "for":
                for i in range(op[2], op[3] + 1):
                    env[op[1]] = i
                    block(op[4])
            elif k == "if":
                if env[op[1]] % op[2] == op[3]:
                    block(op[4])
            else:
                raise ValueError(k)

    block(prog)
    return env


def count_blocks(prog):
    def ce(e):
        return (1 if e[0] in ("add", "mul") else 0) + sum(ce(x) for x in e[1:] if isinstance(x, tuple))

    n = 0
    for op in prog:
        n += 1
        if op[0] in ("set", "add_to"):
            n += ce(op[2])
        elif op[0] in ("for", "if"):
            n += count_blocks(op[4])
    return n


def g_block(seed, diff):
    r = random.Random(seed)
    kind = r.choice(["sum_to_n", "sum_arith", "count_even", "grid", "offbyone"])
    if kind == "sum_to_n":
        n = r.choice([10, 20, 50, 70, 70, 100])
        prog = [("set", "s", ("int", 0)), ("for", "i", 1, n, [("add_to", "s", ("var", "i"))])]
        expect, var = n * (n + 1) // 2, "s"
        prompt = "Tính tổng 1 + 2 + … + %d bằng vòng lặp, lưu vào biến s." % n
        hints = ["Dùng biến tổng bắt đầu từ 0.", "Lặp i từ 1 đến %d và cộng i vào s." % n,
                 "Kết quả phải là %d." % expect]
    elif kind == "sum_arith":
        n, a, d = r.randint(5, 20), r.randint(1, 9), r.randint(1, 9)
        prog = [("set", "s", ("int", 0)),
                ("for", "i", 0, n - 1, [("add_to", "s", ("add", ("int", a), ("mul", ("int", d), ("var", "i"))))])]
        expect, var = n * a + d * n * (n - 1) // 2, "s"
        prompt = "Cộng %d số hạng đầu của dãy %d, %d, %d, ... (công sai %d) vào biến s." % (n, a, a + d, a + 2 * d, d)
        hints = ["Số hạng thứ i (i = 0, 1, ...) là %d + %d·i." % (a, d), "Lặp i từ 0 đến %d." % (n - 1),
                 "Kết quả phải là %d." % expect]
    elif kind == "count_even":
        n = r.randint(10, 100)
        prog = [("set", "c", ("int", 0)),
                ("for", "i", 1, n, [("if", "i", 2, 0, [("add_to", "c", ("int", 1))])])]
        expect, var = n // 2, "c"
        prompt = "Đếm số số chẵn trong 1..%d, lưu vào biến c." % n
        hints = ["Số chẵn là số i chia 2 dư 0.", "Dùng câu lệnh nếu bên trong vòng lặp.", "Kết quả phải là %d." % expect]
    elif kind == "grid":
        rr, cc = r.randint(2, 9), r.randint(2, 10)
        if r.random() < 0.3:
            rr, cc = 7, 10
        prog = [("set", "t", ("int", 0)),
                ("for", "i", 1, rr, [("for", "j", 1, cc, [("add_to", "t", ("int", 1))])])]
        expect, var = rr * cc, "t"
        prompt = "Xếp %d hàng × %d cột drone; đếm tổng số drone vào biến t." % (rr, cc)
        hints = ["Mỗi hàng có %d drone." % cc, "Dùng hai vòng lặp lồng nhau.", "Kết quả phải là %d." % expect]
    else:
        n = r.choice([10, 50, 70, 100])
        fixed = [("set", "s", ("int", 0)), ("for", "i", 1, n, [("add_to", "s", ("var", "i"))])]
        buggy = [("set", "s", ("int", 0)), ("for", "i", 1, n - 1, [("add_to", "s", ("var", "i"))])]
        correct = n * (n + 1) // 2
        assert run(fixed)["s"] == correct and run(buggy)["s"] == correct - n, "loi lech mot khong nhu mong doi"
        prompt = "Chương trình tính 1 + … + %d cho kết quả %d thay vì %d. Tìm lỗi và sửa." % (n, correct - n, correct)
        hints = ["So sánh kết quả với giá trị mong đợi: thiếu bao nhiêu?", "Thiếu đúng %d, là số hạng cuối." % n,
                 "Vòng lặp dừng ở %d thay vì %d; sửa giới hạn của vòng lặp." % (n - 1, n)]
        return mk("block-vm", diff, seed, prompt, {"kind": kind, "buggy": buggy},
                  {"fixed": fixed, "expected": correct, "buggyResult": correct - n},
                  ["máy ảo chạy chương trình đã sửa == n(n+1)/2", "máy ảo chạy chương trình lỗi == đáp án − n"], hints,
                  {"star3": {"maxBlocks": count_blocks(fixed)}})
    got = run(prog)[var]
    assert got == expect, "VM khac cong thuc"
    return mk("block-vm", diff, seed, prompt, {"kind": kind, "variable": var},
              {"reference": prog, "expected": expect},
              ["máy ảo chạy chương trình mẫu == công thức đóng"], hints,
              {"star3": {"maxBlocks": count_blocks(prog)}})


# ----------------------------------------------------------------------------
# MACH 4 - Do thi
# ----------------------------------------------------------------------------

LET = "ABCDEFGH"
EULER_VN = {"circuit": "đi được và quay về chỗ cũ", "path": "đi được, từ một đỉnh lẻ tới đỉnh lẻ còn lại", "none": "không đi được"}


def rand_connected(r, n, m):
    order = list(range(n))
    r.shuffle(order)
    edges = set()
    for i in range(1, n):
        j = r.randrange(i)
        a, b = order[i], order[j]
        edges.add((min(a, b), max(a, b)))
    allp = [(i, j) for i in range(n) for j in range(i + 1, n) if (i, j) not in edges]
    r.shuffle(allp)
    for e in allp[:max(0, m - len(edges))]:
        edges.add(e)
    es = sorted(edges)
    ws = r.sample(range(1, 40), len(es))
    return [(a, b, w) for (a, b), w in zip(es, ws)]


def build_adj(n, E):
    adj = {i: [] for i in range(n)}
    for a, b, w in E:
        adj[a].append((b, w))
        adj[b].append((a, w))
    return adj


def dijkstra(n, E, s):
    adj = build_adj(n, E)
    dist = {i: math.inf for i in range(n)}
    dist[s] = 0
    pq = [(0, s)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(pq, (dist[v], v))
    return dist, adj


def floyd_row(n, E, s):
    D = [[math.inf] * n for _ in range(n)]
    for i in range(n):
        D[i][i] = 0
    for a, b, w in E:
        D[a][b] = D[b][a] = min(D[a][b], w)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if D[i][k] + D[k][j] < D[i][j]:
                    D[i][j] = D[i][k] + D[k][j]
    return D[s]


def kruskal(n, E):
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    chosen = []
    for a, b, w in sorted(E, key=lambda e: e[2]):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            chosen.append((a, b, w))
    return chosen


def prim(n, E):
    adj = build_adj(n, E)
    seen = {0}
    pq = [(w, 0, v) for v, w in adj[0]]
    heapq.heapify(pq)
    chosen = []
    while pq and len(seen) < n:
        w, u, v = heapq.heappop(pq)
        if v in seen:
            continue
        seen.add(v)
        chosen.append((min(u, v), max(u, v), w))
        for x, ww in adj[v]:
            if x not in seen:
                heapq.heappush(pq, (ww, v, x))
    return chosen


def euler_bruteforce(n, E):
    m = len(E)
    adj = {i: [] for i in range(n)}
    for idx, (a, b, _) in enumerate(E):
        adj[a].append((b, idx))
        adj[b].append((a, idx))

    def dfs(u, used, cnt):
        if cnt == m:
            return True
        for v, idx in adj[u]:
            if idx not in used:
                used.add(idx)
                if dfs(v, used, cnt + 1):
                    used.discard(idx)
                    return True
                used.discard(idx)
        return False

    return any(dfs(s, set(), 0) for s in range(n))


def euler_class(n, E):
    deg = [0] * n
    for a, b, _ in E:
        deg[a] += 1
        deg[b] += 1
    odd = [i for i in range(n) if deg[i] % 2]
    if len(odd) == 0:
        return "circuit", odd, deg
    if len(odd) == 2:
        return "path", odd, deg
    return "none", odd, deg


def edges_text(E):
    return ", ".join("%s–%s %d" % (LET[a], LET[b], w) for a, b, w in E)


def g_graph(seed, diff):
    r = random.Random(seed)
    n = 5 + diff // 2
    kind = ["shortest", "mst", "euler"][seed % 3]
    if kind == "euler":
        want = ["circuit", "path", "none"][(seed // 3) % 3]
        for attempt in range(4000):
            nn = r.choice([5, 6])
            E = rand_connected(r, nn, r.randint(nn, 9))
            cls, odd, deg = euler_class(nn, E)
            if cls == want:
                break
        else:
            raise AssertionError("khong tim duoc do thi dang %s" % want)
        assert euler_bruteforce(nn, E) == (cls != "none"), "quy tac bac le khac vet can"
        prompt = ("Đồ thị %d đỉnh, dây: %s. Có thể đi qua mỗi dây đúng một lần không? Nếu có, bắt đầu và kết thúc ở đâu?"
                  % (nn, edges_text(E)))
        ans = {"class": cls, "oddVertices": [LET[i] for i in odd]}
        hints = ["Đếm bậc của từng đỉnh (số dây nối vào đỉnh).", "Đường đi Euler tồn tại khi có 0 hoặc 2 đỉnh bậc lẻ.",
                 "Đỉnh bậc lẻ: %s → %s." % (", ".join(LET[i] for i in odd) or "không có", EULER_VN[cls])]
        return mk("graph", diff, seed, prompt, {"n": nn, "edges": E, "task": kind}, ans,
                  ["quy tắc bậc lẻ == tìm kiếm vét cạn (quay lui)"], hints)
    for attempt in range(500):
        E = rand_connected(r, n, r.randint(n + 1, n + 4))
        if kind == "shortest":
            s, t = 0, n - 1
            dist, adj = dijkstra(n, E, s)
            fw = floyd_row(n, E, s)
            assert all(abs(dist[i] - fw[i]) < 1e-9 for i in range(n)), "Dijkstra khac Floyd–Warshall"
            order = sorted(range(n), key=lambda x: dist[x])
            cntp = [0] * n
            cntp[s] = 1
            for u in order:
                for v, w in adj[u]:
                    if dist[u] + w == dist[v]:
                        cntp[v] += cntp[u]
            if cntp[t] != 1:
                continue
            path, cur = [t], t
            while cur != s:
                for v, w in adj[cur]:
                    if dist[v] + w == dist[cur]:
                        cur = v
                        path.append(v)
                        break
            path.reverse()
            wmap = {(min(a, b), max(a, b)): w for a, b, w in E}
            total = sum(wmap[(min(path[i], path[i + 1]), max(path[i], path[i + 1]))] for i in range(len(path) - 1))
            assert total == dist[t]
            prompt = "Đồ thị %d đỉnh, dây: %s. Tìm đường dây ngắn nhất từ %s đến %s." % (n, edges_text(E), LET[s], LET[t])
            hints = ["Thử các đường đi và cộng trọng số.", "Đường ngắn nhất là duy nhất, dài %d." % dist[t],
                     "Đường: %s, tổng %d." % (" – ".join(LET[i] for i in path), dist[t])]
            return mk("graph", diff, seed, prompt, {"n": n, "edges": E, "task": kind, "from": LET[s], "to": LET[t]},
                      {"length": dist[t], "path": [LET[i] for i in path]},
                      ["Dijkstra == Floyd–Warshall", "đường duy nhất (đếm đường ngắn nhất = 1)", "cộng trọng số đường == khoảng cách"],
                      hints)
        else:
            K = kruskal(n, E)
            P = prim(n, E)
            tk, tp = sum(w for *_, w in K), sum(w for *_, w in P)
            assert tk == tp and sorted((min(a, b), max(a, b)) for a, b, _ in K) == sorted((min(a, b), max(a, b)) for a, b, _ in P), "Kruskal khac Prim"
            assert len(K) == n - 1
            prompt = "Đồ thị %d đỉnh, dây: %s. Chọn các dây để nối mọi đèn với tổng độ dài ít nhất." % (n, edges_text(E))
            hints = ["Cây khung nhỏ nhất có đúng %d dây." % (n - 1), "Chọn dây nhẹ nhất không tạo chu trình.",
                     "Các dây chọn: %s, tổng %d." % (edges_text(sorted(K, key=lambda e: e[2])), tk)]
            return mk("graph", diff, seed, prompt, {"n": n, "edges": E, "task": kind},
                      {"total": tk, "edges": [[LET[a], LET[b], w] for a, b, w in sorted(K, key=lambda e: e[2])]},
                      ["Kruskal == Prim (tổng và tập dây; trọng số đôi một khác nhau)"], hints)
    raise AssertionError("khong dat dieu kien duy nhat")


# ----------------------------------------------------------------------------
# MACH 5 - So hoc
# ----------------------------------------------------------------------------

WEEK = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"]


def g_modular(seed, diff):
    r = random.Random(seed)
    kind = ["crt", "weekday", "lastdigit"][seed % 3]
    if kind == "crt":
        sets = {1: [(2, 5, 7)], 2: [(2, 5, 7), (3, 5, 7)], 3: [(3, 4, 5), (4, 9, 5)],
                4: [(5, 7, 9), (4, 9, 5)], 5: [(2, 3, 5, 7), (5, 7, 9)]}[diff]
        ms = r.choice(sets)
        rs = [r.randrange(m) for m in ms]
        M = math.prod(ms)
        sols = [x for x in range(M) if all(x % m == rr for m, rr in zip(ms, rs))]
        assert len(sols) == 1, "nghiem khong duy nhat"
        crt = sum(rr * (M // m) * pow(M // m, -1, m) for m, rr in zip(ms, rs)) % M
        assert crt == sols[0], "CRT khac duyet"
        prompt = "Tìm x trong 0..%d thỏa: %s." % (M - 1, "; ".join("x ≡ %d (mod %d)" % (rr, m) for m, rr in zip(ms, rs)))
        hints = ["Các mô-đun đôi một nguyên tố cùng nhau nên nghiệm duy nhất modulo %d." % M,
                 "Thử các số thỏa điều kiện đầu, lọc dần bằng điều kiện tiếp theo.", "Đáp án x = %d." % sols[0]]
        return mk("modular", diff, seed, prompt, {"kind": "crt", "moduli": list(ms), "residues": rs}, {"x": sols[0], "M": M},
                  ["duyệt toàn bộ 0..M − 1 == công thức CRT", "nghiệm duy nhất"], hints)
    if kind == "weekday":
        w = r.randrange(7)
        n = r.choice([70, 100, 365, 1000, 5000])
        cur = w
        for _ in range(n):
            cur = (cur + 1) % 7
        assert cur == (w + n) % 7
        prompt = "Hôm nay là %s. %d ngày sau là thứ mấy?" % (WEEK[w], n)
        hints = ["Mỗi 7 ngày thì quay lại cùng thứ.", "Tính %d chia 7 dư bao nhiêu." % n,
                 "%d chia 7 dư %d nên là %s." % (n, n % 7, WEEK[(w + n) % 7])]
        return mk("modular", diff, seed, prompt, {"kind": "weekday", "weekday": w, "days": n}, {"weekday": (w + n) % 7, "name": WEEK[(w + n) % 7]},
                  ["mô phỏng từng ngày == (w + n) mod 7"], hints)
    a = r.randint(2, 9)
    k = r.randint(2, 100 * diff)
    cur = 1
    for _ in range(k):
        cur = (cur * a) % 10
    assert cur == pow(a, k, 10)
    prompt = "Chữ số tận cùng của %d^%d là gì?" % (a, k)
    hints = ["Chữ số tận cùng lặp lại theo chu kỳ.", "Xét các lũy thừa nhỏ của %d để tìm chu kỳ." % a,
             "Đáp án là %d." % cur]
    return mk("modular", diff, seed, prompt, {"kind": "lastdigit", "a": a, "k": k}, {"digit": cur},
              ["nhân lặp từng bước mod 10 == pow(a, k, 10)"], hints)


# ----------------------------------------------------------------------------
# MACH 6 - To hop
# ----------------------------------------------------------------------------


def grid_dp(W, H, blocked=None):
    dp = [[0] * (W + 1) for _ in range(H + 1)]
    dp[0][0] = 1
    for y in range(H + 1):
        for x in range(W + 1):
            if (x, y) == (0, 0):
                continue
            if blocked and (x, y) == blocked:
                dp[y][x] = 0
                continue
            dp[y][x] = (dp[y][x - 1] if x else 0) + (dp[y - 1][x] if y else 0)
    return dp[H][W]


def grid_dfs(W, H, blocked=None):
    def go(x, y):
        if blocked and (x, y) == blocked:
            return 0
        if (x, y) == (W, H):
            return 1
        t = 0
        if x < W:
            t += go(x + 1, y)
        if y < H:
            t += go(x, y + 1)
        return t

    return go(0, 0)


def g_count(seed, diff):
    r = random.Random(seed)
    kind = ["comb", "perm", "grid", "gridblock"][seed % 4]
    if kind == "comb":
        n = r.randint(4, min(12, 6 + 2 * diff))
        k = r.randint(2, n - 2)
        assert math.comb(n, k) == sum(1 for _ in itertools.combinations(range(n), k))
        prompt = "Chọn %d trong %d đèn để bật. Có bao nhiêu cách?" % (k, n)
        hints = ["Thứ tự chọn không quan trọng.", "Dùng tổ hợp C(%d, %d)." % (n, k), "C(%d, %d) = %d." % (n, k, math.comb(n, k))]
        return mk("count", diff, seed, prompt, {"kind": "comb", "n": n, "k": k}, {"count": math.comb(n, k)},
                  ["math.comb == đếm tổ hợp liệt kê"], hints)
    if kind == "perm":
        n = r.randint(4, 8)
        k = r.randint(2, min(4, n))
        assert math.perm(n, k) == sum(1 for _ in itertools.permutations(range(n), k))
        prompt = "Xếp %d đèn khác màu thành hàng từ %d màu. Có bao nhiêu cách?" % (k, n)
        hints = ["Thứ tự quan trọng và không lặp màu.", "Nhân %s." % "·".join(str(n - i) for i in range(k)),
                 "Kết quả %d." % math.perm(n, k)]
        return mk("count", diff, seed, prompt, {"kind": "perm", "n": n, "k": k}, {"count": math.perm(n, k)},
                  ["math.perm == đếm chỉnh hợp liệt kê"], hints)
    W, H = r.randint(2, 6), r.randint(2, 6)
    if kind == "grid":
        dp, dfs, cb = grid_dp(W, H), grid_dfs(W, H), math.comb(W + H, W)
        assert dp == dfs == cb, "dem duong luoi khong khop"
        prompt = "Lưới %d × %d ô vuông: đếm đường ngắn nhất từ góc dưới trái lên góc trên phải (chỉ sang phải hoặc lên)." % (W, H)
        hints = ["Mỗi đường gồm %d bước sang phải và %d bước lên." % (W, H),
                 "Chọn vị trí các bước 'lên' trong %d bước." % (W + H), "C(%d, %d) = %d." % (W + H, W, cb)]
        return mk("count", diff, seed, prompt, {"kind": "grid", "W": W, "H": H}, {"count": cb},
                  ["quy hoạch động == duyệt DFS == C(W + H, W)"], hints)
    cells = [(x, y) for x in range(W + 1) for y in range(H + 1) if (x, y) not in [(0, 0), (W, H)]]
    bx = r.choice(cells)
    dp, dfs = grid_dp(W, H, bx), grid_dfs(W, H, bx)
    assert dp == dfs, "dem duong luoi co o chan khong khop"
    prompt = "Lưới %d × %d ô vuông, nút (%d, %d) bị chặn. Đếm đường ngắn nhất từ (0, 0) đến (%d, %d)." % (W, H, bx[0], bx[1], W, H)
    hints = ["Đếm tổng số đường rồi trừ các đường qua nút bị chặn, hoặc đếm từng nút.",
             "Dùng bảng đếm: mỗi nút bằng tổng hai nút kề trước, nút bị chặn bằng 0.", "Kết quả %d." % dp]
    return mk("count", diff, seed, prompt, {"kind": "gridblock", "W": W, "H": H, "blocked": list(bx)}, {"count": dp},
              ["quy hoạch động == duyệt DFS"], hints)


# ----------------------------------------------------------------------------
# "Su that ve n" - sinh tu dong tu dinh nghia
# ----------------------------------------------------------------------------


def factorize(n):
    f, p = {}, 2
    while p * p <= n:
        while n % p == 0:
            f[p] = f.get(p, 0) + 1
            n //= p
        p += 1
    if n > 1:
        f[n] = f.get(n, 0) + 1
    return f


def proper_divisors(n):
    return [d for d in range(1, n) if n % d == 0]


def is_weird(n):
    ds = proper_divisors(n)
    if sum(ds) <= n:
        return False
    mask = 1
    for d in ds:
        mask |= mask << d
    return not (mask >> n) & 1


CLS_VN = {"hoan hao": "hoàn hảo", "du": "dư", "thieu": "thiếu"}


def make_fact(n):
    if n == 1:
        return {"n": 1, "text": "1 chỉ có một ước là 1; 1 không phải số nguyên tố cũng không phải hợp số.", "tags": ["unit"]}
    f = factorize(n)
    prod = 1
    for p, e in f.items():
        prod *= p ** e
    assert prod == n
    tau_formula = math.prod(e + 1 for e in f.values())
    sigma_formula = math.prod((p ** (e + 1) - 1) // (p - 1) for p, e in f.items()) - n
    ds = proper_divisors(n)
    assert tau_formula == len(ds) + 1, "so uoc khac cong thuc"
    assert sigma_formula == sum(ds), "tong uoc khac cong thuc"
    s = sum(ds)
    cls = "hoan hao" if s == n else ("du" if s > n else "thieu")
    fs = " · ".join(("%d^%d" % (p, e)) if e > 1 else str(p) for p, e in sorted(f.items()))
    tags = [cls]
    if len(f) == 1 and list(f.values())[0] == 1:
        tags.append("prime")
    if len(f) == 3 and all(e == 1 for e in f.values()):
        tags.append("sphenic")
    weird = is_weird(n)
    if weird:
        tags.append("weird")
    text = "%d = %s. Có %d ước dương; tổng các ước thực sự là %d, %s %d nên %d là số %s." % (
        n, fs, tau_formula, s, "lớn hơn" if s > n else ("nhỏ hơn" if s < n else "bằng"), n, n, CLS_VN[cls])
    if weird:
        text += " Đặc biệt, không tập con nào của các ước thực sự cộng lại bằng chính nó: đây là số kỳ lạ."
    return {"n": n, "text": text, "tags": tags}


# ----------------------------------------------------------------------------
# Kiem tra lai moi dap an viet tay trong GDD v2.0
# ----------------------------------------------------------------------------


def verify_core():
    out = []

    def ok(cond, msg):
        assert cond, "SAI: " + msg
        out.append("PASS " + msg)

    ok(abs(70 * math.exp(-4.95) - 0.496) < 0.001, "1.1: b = 1,65 cho sai số ≈ 0,496 m")
    ok(70 * math.exp(-4.8) > 0.5 and abs(70 * math.exp(-4.8) - 0.576) < 0.001, "1.1: b = 1,60 cho ≈ 0,576 m (không đạt)")
    ok(abs(math.log(140) / 3 - 1.647) < 0.001 and abs(math.log(140) - 4.94) < 0.005, "1.1: ln140 ≈ 4,94 và ln140/3 ≈ 1,647")
    ok(abs(70 * (1 - math.exp(-5)) - 69.53) < 0.01, "Phần 1.1: h(5) ≈ 69,53 m")
    S = lambda N: 1 - Fraction(1, 2 ** N)
    ok(S(7) >= Fraction(99, 100) > S(6) and abs(float(S(7)) - 0.9922) < 1e-4 and abs(float(S(6)) - 0.984) < 1e-3, "1.2: N = 7 (0,9922), N = 6 (0,984)")
    f13 = lambda x: (x * x - 49) / (x - 7)
    ok(abs(f13(7 + 1e-6) - 14) < 1e-3 and abs(f13(7 - 1e-6) - 14) < 1e-3, "1.3: giới hạn tại x = 7 là 14")
    opts = {"A": lambda x: 70 * x / (x + 1), "B": lambda x: 70 * (1 - math.exp(-x)), "C": lambda x: 70 * x,
            "D": lambda x: 70 * math.sin(x), "E": lambda x: 70 + 1 / x}
    got = sorted(k for k, f in opts.items() if isinstance(_num_limit(f), float) and abs(_num_limit(f) - 70) < 1e-2)
    ok(got == ["A", "B", "E"], "1.4: đáp án đúng là A, B, E (C: vô cực, D: không tồn tại)")
    R, F = MATS["R90"], MATS["FX"]
    ok(mv(F, mv(R, (1, 0))) == (0, -1), "2.3: R rồi F đưa (1,0) tới (0,-1)")
    ok(mv(R, mv(F, (1, 0))) == (0, 1), "2.3: F rồi R cho (0,1) (sai thứ tự)")
    ok(mm(F, R) == ((0, -1), (-1, 0)) and mm(R, F) == ((0, 1), (1, 0)) and mm(F, R) != mm(R, F), "2.3: F·R = [[0,-1],[-1,0]], R·F = [[0,1],[1,0]], không giao hoán")
    c, s = 0.5, math.sqrt(3) / 2
    Rt = ((c, s), (-s, c))
    Rr = ((c, -s), (s, c))
    ok(mv(Rr, (1, 0))[1] > 0 and mv(Rt, (1, 0))[1] < 0 and abs(mv(Rt, (1, 0))[1] + s) < 1e-12, "2.4: R(60°)·(1,0) hướng lên, Rᵀ·(1,0) hướng xuống")
    ok(abs(_det(Rr) - 1) < 1e-12 and abs(70 ** 2 * _det(Rr) - 4900) < 1e-9, "2.4: det R = 1; det(70·R) = 4900")
    ok(run([("set", "t", ("int", 0)), ("for", "i", 1, 7, [("for", "j", 1, 10, [("add_to", "t", ("int", 1))])])])["t"] == 70, "3.2: 7 hàng × 10 cột = 70 drone")
    ok(run([("set", "s", ("int", 0)), ("for", "i", 1, 70, [("add_to", "s", ("var", "i"))])])["s"] == 2485 == 70 * 71 // 2, "3.4: tổng 1..70 = 2485")
    ok(run([("set", "s", ("int", 0)), ("for", "i", 1, 69, [("add_to", "s", ("var", "i"))])])["s"] == 2415 == 2485 - 70, "3.5: lặp 1..69 cho 2415 (thiếu 70)")
    E = [(0, 1, 4), (0, 2, 2), (2, 1, 1), (1, 3, 5), (2, 3, 8), (3, 4, 3), (1, 4, 7), (2, 4, 12)]
    d, _ = dijkstra(5, E, 0)
    ok(d[4] == 10 and floyd_row(5, E, 0)[4] == 10, "4.1: đường ngắn nhất A→E = 10 (Dijkstra và Floyd–Warshall)")
    w = {(min(a, b), max(a, b)): x for a, b, x in E}
    pathsum = lambda p: sum(w[(min(p[i], p[i + 1]), max(p[i], p[i + 1]))] for i in range(len(p) - 1))
    claim = {(0, 2, 1, 4): 10, (0, 1, 4): 11, (0, 2, 1, 3, 4): 11, (0, 1, 3, 4): 12, (0, 2, 3, 4): 13, (0, 2, 4): 14}
    ok(all(pathsum(p) == v for p, v in claim.items()), "4.1: sáu đường liệt kê trong GDD có tổng đúng 10, 11, 11, 12, 13, 14")
    allsums = []
    for k in range(0, 4):
        for mid in itertools.permutations([1, 2, 3], k):
            p = (0,) + mid + (4,)
            if all((min(p[i], p[i + 1]), max(p[i], p[i + 1])) in w for i in range(len(p) - 1)):
                allsums.append(pathsum(p))
    ok(min(allsums) == 10 and allsums.count(10) == 1, "4.1: duyệt mọi đường đơn, nhỏ nhất 10 và duy nhất")
    K, P = kruskal(5, E), prim(5, E)
    ok(sum(x for *_, x in K) == 11 == sum(x for *_, x in P), "4.2: cây khung nhỏ nhất tổng 11 (Kruskal và Prim)")
    ok(sorted((min(a, b), max(a, b), x) for a, b, x in K) == sorted([(1, 2, 1), (0, 2, 2), (3, 4, 3), (1, 3, 5)]), "4.2: các dây C–B 1, A–C 2, D–E 3, B–D 5")
    cls, odd, deg = euler_class(5, E)
    ok(cls == "path" and [LET[i] for i in odd] == ["D", "E"] and deg == [2, 4, 4, 3, 3] and euler_bruteforce(5, E), "4.3: bậc A2 B4 C4 D3 E3, đường Euler D→E tồn tại")
    sol = [n for n in range(70) if n % 2 == 1 and n % 5 == 2 and n % 7 == 3]
    ok(sol == [17], "5.1: n = 17 là nghiệm duy nhất trong 0..69")
    ok([n for n in range(1, 71) if n % 2 == 0 and n % 5 == 0 and n % 7 == 0] == [70], "5.2: chỉ 70 chia hết cho 2, 5, 7 trong 1..70")
    ok(70 % 7 == 0 and 70 == 10 * 7, "5.3: 70 ngày = 10 tuần, cùng thứ")
    ok(math.comb(8, 4) == 70 == sum(1 for _ in itertools.combinations(range(8), 4)), "6.1: C(8,4) = 70 (công thức và liệt kê)")
    ok(math.perm(5, 3) == 60 == sum(1 for _ in itertools.permutations(range(5), 3)), "6.2: 5·4·3 = 60")
    ok(grid_dp(4, 4) == grid_dfs(4, 4) == 70, "6.3: lưới 4×4 có 70 đường ngắn nhất")
    ok(factorize(70) == {2: 1, 5: 1, 7: 1} and 2 * 5 * 7 == 70, "70 = 2 · 5 · 7")
    ok(proper_divisors(70) == [1, 2, 5, 7, 10, 14, 35] and sum(proper_divisors(70)) == 74, "Các ước thực sự của 70 là 1, 2, 5, 7, 10, 14, 35, tổng 74")
    weird_list = [n for n in range(1, 10000) if is_weird(n)]
    ok(weird_list == [70, 836, 4030, 5830, 7192, 7912, 9272], "Số kỳ lạ < 10000 khớp dãy OEIS A006037: 70, 836, 4030, 5830, 7192, 7912, 9272")
    return out


# ----------------------------------------------------------------------------
# Loc van ban tu dong
# ----------------------------------------------------------------------------

BANNED = [r"\bngu\b", r"\bdốt\b", r"\bẩu\b", r"máy móc", r"vội vàng", r"nhiệt tình quá mức",
          r"\bkém\b", r"thất bại", r"\bbạn sai\b", r"\bngốc\b"]


def _strip(t):
    import unicodedata
    t = t.replace("đ", "d").replace("Đ", "D")
    return "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")


def lint(strings):
    bad = []
    for s in strings:
        low = s.lower()
        low_ascii = _strip(low)
        for pat in BANNED:
            if re.search(pat, low) or re.search(_strip(pat), low_ascii):
                bad.append(("tu cam", pat, s))
        if len(s) > 320:
            bad.append(("qua dai", len(s), s[:60]))
        if "TODO" in s or "{" in s or "}" in s:
            bad.append(("khuon mau chua dien", "", s[:60]))
    return bad


# ----------------------------------------------------------------------------
# Che do Dao choi (GDD 2.3, muc 6.1): van ban khong thuat ngu + bo quet muc de doc
# ----------------------------------------------------------------------------

# Thuat ngu cam trong de va goi y Dao choi (so khop ca dang co dau va khong dau, nguyen tu).
CASUAL_BANNED = ["giới hạn", "ma trận", "đồ thị", "đỉnh", "cạnh", "hàm", "đạo hàm", "modulo",
                 "tổ hợp", "biến", "vòng lặp", "thuật toán"]
CASUAL_MAX_WORDS = 20
CASUAL_MAX_NUMBERS = 3
CASUAL_MODULES = ("plot-limit", "series", "beam-order", "graph", "count")


def _sentences(text):
    return [x.strip() for x in re.split(r"(?<=[.?!])\s+", text) if x.strip()]


def lint_casual(strings):
    """Quet muc de doc: tu cam, so tu moi cau, so chu so moi cau."""
    bad = []
    pats = [re.compile(r"(?<![\w])%s(?![\w])" % re.escape(_strip(w)), re.UNICODE) for w in CASUAL_BANNED]
    for s in strings:
        plain = _strip(s.lower())
        for w, pat in zip(CASUAL_BANNED, pats):
            if pat.search(plain):
                bad.append(("thuat ngu cam", w, s))
        for sent in _sentences(s):
            words = len(sent.split())
            if words > CASUAL_MAX_WORDS:
                bad.append(("cau qua dai", words, sent))
            nums = len(re.findall(r"\d+(?:[.,]\d+)?", sent))
            if nums > CASUAL_MAX_NUMBERS:
                bad.append(("qua nhieu so", nums, sent))
    return bad


def _count_choices(lv):
    """Ba dap an nhieu cho Dao choi (bam chon, khong go so). Dap an dung xuat hien dung mot lan."""
    d, ans = lv["data"], lv["answer"]["count"]
    kind = d["kind"]
    if kind in ("comb", "perm"):
        n, k = d["n"], d["k"]
        cands = [math.perm(n, k), math.comb(n, k), n * k, n + k, math.comb(n, k) + n, 2 ** n, ans + 1, ans * 2]
    else:
        W, H = d["W"], d["H"]
        cands = [math.comb(W + H, W), W * H, (W + 1) * (H + 1), W + H, ans + W, ans * 2, max(1, ans - H)]
    pool = []
    for c in cands:
        if c > 0 and c != ans and c not in pool:
            pool.append(c)
    r = random.Random(lv["seed"] * 31 + 7)
    r.shuffle(pool)
    choices = pool[:3] + [ans]
    r.shuffle(choices)
    assert choices.count(ans) == 1 and len(set(choices)) == len(choices) == 4, "lua chon trung"
    return choices, choices.index(ans)


def casual_for(lv):
    """Lop trinh bay Dao choi; None neu dang/do kho nay khong co trong Dao choi."""
    m, d, a = lv["module"], lv["data"], lv["answer"]
    if m not in CASUAL_MODULES or lv["difficulty"] > 2:
        return None
    if m == "plot-limit":
        return {
            "prompt": "Quả pháo cần dừng ở độ cao %s mét. Kéo hai thanh trượt để pháo lên sát vạch rồi chậm lại. "
                      "Sau %d giây, pháo phải cách vạch không quá %s mét." % (d["target"], d["T"], num(d["eps"])),
            "hints": ["Thanh Độ cao đích cho biết pháo sẽ dừng ở đâu.",
                      "Đặt Độ cao đích đúng bằng %s mét." % d["target"],
                      "Kéo thanh Độ nhanh dừng tới %s hoặc hơn." % num(a["b_min"])],
            "labels": {"a": "Độ cao đích", "b": "Độ nhanh dừng"},
        }
    if m == "series":
        q = Fraction(d["q"])
        fill = {Fraction(1, 2): "một nửa", Fraction(1, 3): "hai phần ba"}[q]
        left = {Fraction(1, 2): "còn một nửa", Fraction(1, 3): "còn một phần ba"}[q]
        p = d["percent"]
        return {
            "prompt": "Mỗi lần rót, nước lấp thêm %s phần cốc còn trống. Cần rót ít nhất mấy lần để cốc đầy %s%%?"
                      % (fill, num(p)),
            "hints": ["Sau mỗi lần rót, phần còn trống chỉ %s so với trước." % left,
                      "Phần còn trống phải không quá %s%%." % num(round(100 - p, 4)),
                      "Rót đúng %d lần là vừa đủ." % a["N"]],
        }
    if m == "beam-order":
        o = a["orders"][0]
        return {
            "prompt": "Tia sáng đi vào theo mũi tên trắng. Đặt hai tấm gương theo đúng thứ tự để tia ra trùng mũi tên vàng.",
            "hints": ["Gương đặt trước sẽ đổi hướng tia trước.",
                      "Thử đổi chỗ hai tấm gương rồi bấm Chạy thử.",
                      "Đặt gương %s trước, rồi gương %s." % (CASUAL_MIRROR[o[0]], CASUAL_MIRROR[o[1]])],
            "mirrorNames": {k: CASUAL_MIRROR[k] for k in d["mirrors"]},
        }
    if m == "graph":
        if d["task"] == "shortest":
            return {
                "prompt": "Nối từ đèn %s tới đèn %s bằng đường dây ngắn nhất. Số ghi trên mỗi dây là độ dài của dây."
                          % (d["from"], d["to"]),
                "hints": ["Cộng độ dài các dây trên đường đi rồi so sánh.",
                          "Đường ngắn nhất dài %d." % a["length"],
                          "Đi theo %s." % " – ".join(a["path"])],
            }
        if d["task"] == "mst":
            return {
                "prompt": "Chọn dây sao cho đèn nào cũng có điện, với tổng độ dài ít nhất. Số ghi trên mỗi dây là độ dài của dây.",
                "hints": ["Chọn dây ngắn trước, bỏ dây làm thành vòng kín.",
                          "Cần đúng %d sợi dây." % (d["n"] - 1),
                          "Chọn các dây %s." % ", ".join("%s–%s" % (x, y) for x, y, _ in a["edges"])],
            }
        return None
    if m == "count":
        kind = d["kind"]
        choices, idx = _count_choices(lv)
        c = a["count"]
        if kind == "comb":
            prompt = ("Có %d chiếc ghế trống, cần chọn %d chiếc để mời khách ngồi. Có bao nhiêu cách chọn?"
                      % (d["n"], d["k"]))
            hints = ["Chỉ cần biết chọn ghế nào, thứ tự chọn không quan trọng.",
                     "Thử đếm với ít ghế hơn rồi tìm quy luật.", "Có %d cách." % c]
        elif kind == "perm":
            prompt = ("Có %d bạn, cần mời %d bạn ngồi thành một hàng. Đổi chỗ ngồi cũng tính là cách khác. "
                      "Có bao nhiêu cách?" % (d["n"], d["k"]))
            hints = ["Ghế đầu có nhiều lựa chọn nhất, các ghế sau ít dần.",
                     "Nhân số lựa chọn của từng ghế với nhau.", "Có %d cách." % c]
        else:
            block = kind == "gridblock"
            prompt = ("Đi từ góc dưới trái tới góc trên phải của lưới %d × %d ô%s. Mỗi bước chỉ sang phải hoặc đi lên. "
                      "Có bao nhiêu đường đi?" % (d["W"], d["H"], ", tránh nút bị chặn" if block else ""))
            hints = ["Mọi đường đều có cùng số bước sang phải và số bước đi lên.",
                     "Ghi vào mỗi nút số đường tới nó. Số đó bằng tổng nút bên trái và nút bên dưới%s."
                     % ("; nút bị chặn ghi số 0" if block else ""),
                     "Có %d đường đi." % c]
        return {"prompt": prompt, "hints": hints, "choices": choices, "answerIndex": idx}
    return None


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

GENS = [("plot-limit", g_plot_limit), ("series", g_series), ("removable", g_removable),
        ("pick-limit", g_pick_limit), ("beam-order", g_beam_order), ("transpose-bug", g_transpose_bug),
        ("block-vm", g_block), ("graph", g_graph), ("modular", g_modular), ("count", g_count)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-cell", type=int, default=6)
    ap.add_argument("--out", default=".")
    args = ap.parse_args()

    core = verify_core()
    print("verify_core: %d kiem tra dap an GDD, tat ca PASS" % len(core))

    levels, stats = [], {}
    seen = set()
    for gi, (name, g) in enumerate(GENS):
        st = {"generated": 0, "rejected": 0, "duplicate": 0}
        for diff in range(1, 6):
            for k in range(args.per_cell):
                base = gi * 100000 + diff * 1000 + k
                lv = None
                for t in range(6):
                    try:
                        lv = g(base + 7919 * t, diff)
                        break
                    except AssertionError:
                        st["rejected"] += 1
                if lv is None:
                    continue
                key = json.dumps([lv["module"], lv["data"], lv["prompt"]], sort_keys=True, default=str)
                if key in seen:
                    st["duplicate"] += 1
                    continue
                seen.add(key)
                levels.append(lv)
                st["generated"] += 1
        stats[name] = st

    facts = [make_fact(n) for n in range(1, 201)]
    w70 = [f for f in facts if f["n"] == 70][0]
    assert "weird" in w70["tags"] and "sphenic" in w70["tags"]
    assert [f["n"] for f in facts if "weird" in f["tags"]] == [70, 836][:1], "so ky la <= 200 chi co 70"

    texts = []
    for lv in levels:
        texts.append(lv["prompt"])
        texts.extend(lv["hints"])
    texts.extend(f["text"] for f in facts)

    # Lop Dao choi: them sau khi loai trung nen khong lam doi tap man.
    casual_texts = []
    casual_count = Counter()
    for lv in levels:
        cz = casual_for(lv)
        if cz:
            lv["casual"] = cz
            casual_count[lv["module"]] += 1
            casual_texts.append(cz["prompt"])
            casual_texts.extend(cz["hints"])
    texts.extend(casual_texts)
    bad = lint(texts)
    bad_casual = lint_casual(casual_texts)

    os.makedirs(args.out, exist_ok=True)
    enc = lambda o: num(o) if isinstance(o, Fraction) else str(o)
    lv_json = json.dumps(levels, ensure_ascii=False, indent=1, default=enc, sort_keys=True)
    with open(os.path.join(args.out, "levels_generated.json"), "w", encoding="utf-8") as fh:
        fh.write(lv_json)
    with open(os.path.join(args.out, "facts_generated.json"), "w", encoding="utf-8") as fh:
        json.dump(facts, fh, ensure_ascii=False, indent=1)
    total_checks = sum(len(lv["checks"]) for lv in levels)
    report = {
        "verify_core_pass": len(core), "verify_core_items": core,
        "levels": len(levels), "facts": len(facts), "per_module": stats,
        "levels_by_module_diff": dict(Counter("%s/d%d" % (lv["module"], lv["difficulty"]) for lv in levels)),
        "independent_checks_recorded": total_checks,
        "text_strings_linted": len(texts), "lint_violations": len(bad),
        "lint_detail": [list(map(str, b)) for b in bad[:20]],
        "casual_levels": sum(casual_count.values()),
        "casual_by_module": dict(casual_count),
        "casual_rules": {"banned_terms": CASUAL_BANNED, "max_words_per_sentence": CASUAL_MAX_WORDS,
                         "max_numbers_per_sentence": CASUAL_MAX_NUMBERS},
        "casual_strings_linted": len(casual_texts),
        "casual_lint_violations": len(bad_casual),
        "casual_lint_detail": [list(map(str, b)) for b in bad_casual[:20]],
        "sha256_levels": hashlib.sha256(lv_json.encode("utf-8")).hexdigest(),
    }
    with open(os.path.join(args.out, "qa_report.json"), "w", encoding="utf-8") as fh:
        json.dump(report, fh, ensure_ascii=False, indent=1)
    print("levels: %d | facts: %d | kiem chung doc lap: %d | van ban da loc: %d | vi pham: %d"
          % (len(levels), len(facts), total_checks, len(texts), len(bad)))
    print("dao choi: %d man | van ban da quet muc de doc: %d | vi pham: %d"
          % (sum(casual_count.values()), len(casual_texts), len(bad_casual)))
    for b in bad_casual[:10]:
        print("   ", b)
    for k, v in stats.items():
        print("  %-14s %s" % (k, v))
    return 0 if not (bad or bad_casual) else 1


if __name__ == "__main__":
    sys.exit(main())
