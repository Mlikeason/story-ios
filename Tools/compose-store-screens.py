"""Compose localized App Store plates around unretouched simulator screenshots.
Usage: python3 Tools/compose-store-screens.py RAW_DIRECTORY (Pillow, macOS fonts).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageStat
import sys
raw=Path(sys.argv[1])
dst=Path(__file__).resolve().parents[1]/'AppStore/screenshots'
fonts=Path('/System/Library/Fonts/Supplemental')
def face(name,size): return ImageFont.truetype(str(fonts/name),size)
def read(name):
    im=ImageOps.exif_transpose(Image.open(raw/name)).convert('RGB')
    assert 12 < ImageStat.Stat(im.resize((64,64))).mean[0] < 180, name
    return im
def text(draw,at,words,font,color):
    draw.text(at,words,font=font,fill=color,anchor='lt')
titles={
'en': [('A travel journal','in sound.'),('50 minutes of rain,','recorded in Changsha.'),('Fall asleep','in another place.'),('Six places','to return to.')],
'zh': [('一本可以听的','私人旅行手记。'),('在长沙，','录下五十分钟的雨。'),('让一段声音，','陪你慢慢入睡。'),('六个地方，','随时回去听听。')]}
subs={'en':['WESTERN AUSTRALIA   /   2025','CHANGSHA, CHINA   /   2023','25, 45 OR 60 MINUTES   /   A TEN-SECOND FADE','THE FIELD INDEX   /   ALL SIX RECORDINGS OFFLINE'],
      'zh':['西澳大利亚   /   2025','中国 · 长沙   /   2023','25、45 或 60 分钟   /   最后十秒渐弱','实地录音目录   /   六段声音均可离线收听']}
files=['01-player.png','02-changsha.png','03-sleep-timer.png','04-playlist.png']
for lang,loc in [('en','en-US'),('zh','zh-Hans')]:
    out=dst/loc;out.mkdir(parents=True,exist_ok=True)
    for idx,filename in enumerate(files):
        i=idx+1; shot=read(f'{lang}{i:02}.png');assert shot.size==(1206,2622),shot.size
        bg,ink,accent=[('#e8eadc','#23382d','#566756'),('#dbe2e1','#19313c','#4b6068'),('#e9ddd0','#3c2b2c','#715658'),('#e9e5d9','#2d3931','#60675a')][idx]
        page=Image.new('RGB',(1206,2622),bg);d=ImageDraw.Draw(page)
        text(d,(72,48),'STORY.   /   FIELD RECORDINGS',face('Arial Bold.ttf',25),accent)
        d.text((1134,48),f'{i:02}  /  04',font=face('Arial.ttf',25),fill=accent,anchor='rt')
        d.line((72,100,1134,100),fill=accent,width=2)
        head=face('Georgia.ttf' if lang=='en' else 'Songti.ttc',84 if lang=='en' else 88)
        for j,line in enumerate(titles[lang][idx]):
            assert d.textlength(line,font=head)<1063,line
            text(d,(69,133+j*99),line,head,ink)
        text(d,(73,360),subs[lang][idx],face('Arial Bold.ttf' if lang=='en' else 'Songti.ttc',26 if lang=='en' else 32),accent)
        w=985; h=round(w*shot.height/shot.width); x=(1206-w)//2;y=433
        resized=shot.resize((w,h),Image.Resampling.LANCZOS)
        mask=Image.new('L',(w,h));ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1),radius=36,fill=255)
        d.rounded_rectangle((x-2,y-2,x+w+1,y+h+1),radius=38,fill=accent)
        page.paste(resized,(x,y),mask);page.save(out/filename,optimize=True)
    duo=dst/'Duo'/loc;duo.mkdir(parents=True,exist_ok=True)
    for name,filename,size in [('cover-active.png','01-cover-landscape.png',(2034,1398)),(lang+'duo-inner.png','02-inner-portrait.png',(2007,2853))]:
        shot=read(name);assert shot.size==size,(name,shot.size)
        shot.save(duo/filename,optimize=True)
