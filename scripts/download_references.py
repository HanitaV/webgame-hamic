#!/usr/bin/env python3
"""Download source images without dependencies; retain a report for failures."""
import argparse
import concurrent.futures
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def fetch(item, overwrite=False):
    target = ROOT / item["local_path"]
    if target.is_file() and not overwrite:
        return {"id":item["id"],"status":"already_present","bytes":target.stat().st_size}
    try:
        request = urllib.request.Request(item["image_url"],headers={"User-Agent":"Mozilla/5.0"})
        with urllib.request.urlopen(request,timeout=25) as response:
            mime = response.headers.get_content_type()
            if not mime.startswith("image/"):
                raise ValueError("Expected image; received " + mime)
            data = response.read(25*1024*1024+1)
        if len(data)>25*1024*1024:
            raise ValueError("Image exceeds 25 MiB")
        is_png = data.startswith(b"\x89PNG\r\n\x1a\n")
        is_jpg = data.startswith(b"\xff\xd8\xff")
        is_webp = data.startswith(b"RIFF") and data[8:12] == b"WEBP"
        if not (is_png or is_jpg or is_webp):
            raise ValueError("Unsupported image signature")
        target.parent.mkdir(parents=True,exist_ok=True)
        temporary = target.with_suffix(target.suffix+".partial")
        temporary.write_bytes(data)
        temporary.replace(target)
        return {"id":item["id"],"status":"downloaded","bytes":len(data)}
    except Exception as exc:
        return {"id":item["id"],"status":"unavailable","reason":str(exc),
                "page_url":item["page_url"]}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--overwrite",action="store_true")
    args = parser.parse_args()
    sources = json.loads((ROOT/"data/sources.json").read_text(encoding="utf-8"))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda x:fetch(x,args.overwrite),sources["remote_images"]))
    report = {"results":results,"note":"Unavailable references are optional; local assets work offline."}
    (ROOT/"data/reference_download_report.json").write_text(
        json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    for item in results:
        print(item["id"]+": "+item["status"])
    print("Report: data/reference_download_report.json")
