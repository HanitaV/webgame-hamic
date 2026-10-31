from pathlib import Path
import json
p=Path('web/public/data/i18n/vi.json');v=json.loads(p.read_text(encoding='utf-8'))
v['story.egg.egg_hust_gt1.lore']=v['story.egg.egg_hust_gt1.lore'].replace('nằm ngay cạnh hộp phấn trên bục giảng T1','được trưng bày trên bàn gần cửa giảng đường T1')
v['story.egg.egg_uet_rock.lore']=v['story.egg.egg_uet_rock.lore'].replace('Một tảng đá hoa cương khắc chữ đỏ đặt trang trọng trên bệ đá giữa lối cỏ','Một khối đá trắng bất đối xứng, mặt trước khắc tên Trường Đại học Công nghệ, mặt bên ghi lời nhắn về sáng tạo, đặt giữa lối cỏ')
v['story.egg.egg_ussh_chronicle.place']='Điểm trưng bày ngoài Nhà E, USSH'
v['story.egg.egg_ussh_film_reel.place']='Điểm trưng bày ngoài Nhà C, USSH'
p.write_text(json.dumps(v,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
p=Path('web/src/scene/walking.ts');s=p.read_text(encoding='utf-8').replace('  crowd.update(dt, reduceMotion);','  if (!activeBuilding) crowd.update(dt, reduceMotion);');p.write_text(s,encoding='utf-8')
