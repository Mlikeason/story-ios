"""Build a reviewable bilingual store campaign from unchanged app captures.

Run: python3 Tools/compose-store-concept.py
Writes drafts separately from the screenshots already submitted to Apple.
Requires Pillow and macOS system fonts. No generated or reconstructed app UI.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'StoreSources/Captures'
OUT = ROOT / 'AppStore/ScreenshotDrafts/field-notes'
PREVIEW = ROOT / 'build/store-concept-preview'
FONTS = Path('/System/Library/Fonts/Supplemental')
CREAM = '#f2eee3'
INK = '#213e35'
GOLD = '#c4aa70'
MANIFEST = []


def font(size, kind='body', lang='en'):
    if lang == 'zh':
        path = 'Songti.ttc' if kind == 'title' else 'Arial Unicode.ttf'
    else:
        path = {'title': 'Georgia.ttf', 'body': 'Arial.ttf',
                'label': 'Arial Bold.ttf', 'brand': 'Georgia Bold Italic.ttf'}[kind]
    return ImageFont.truetype(str(FONTS / path), size)


def lines(page, xy, value, size, fill, kind='body', lang='en', leading=None, max_width=None):
    draw = ImageDraw.Draw(page)
    face = font(size, kind, lang)
    leading = leading or round(size * 1.28)
    x, y = xy
    for i, line in enumerate(value.split('\n')):
        width = draw.textlength(line, font=face)
        assert max_width is None or width <= max_width, (line, width, max_width)
        box = draw.textbbox((x, y + i * leading), line, font=face, anchor='lt')
        assert box[0] >= 0 and box[2] <= page.width and box[3] <= page.height, (line, box)
        draw.text((x, y + i * leading), line, font=face, fill=fill, anchor='lt')


def brand(page, xy, size, fill, dot=GOLD):
    # Match the app's Georgia bold italic wordmark and tight tracking.
    draw = ImageDraw.Draw(page)
    face = font(size, 'brand')
    x, y = xy
    for letter in 'Story':
        draw.text((x, y), letter, font=face, fill=fill, anchor='lt')
        x += draw.textlength(letter, font=face) - size * .065
    draw.text((x, y), '.', font=face, fill=dot, anchor='lt')


def screen(page, name, xy, width, edge='#17231f', radius=40):
    shot = Image.open(RAW / name).convert('RGB')
    height = round(width * shot.height / shot.width)
    x, y = xy
    assert x >= 0 and y >= 0 and x + width <= page.width and y + height <= page.height
    shot = shot.resize((width, height), Image.Resampling.LANCZOS)
    # Preserve every part of the real screenshot; the rounded frame is outside it.
    shadow = Image.new('RGBA', page.size)
    ImageDraw.Draw(shadow).rounded_rectangle((x-6, y+12, x+width+6, y+height+20),
                                             radius=radius+10, fill=(8, 20, 16, 44))
    page.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
    ImageDraw.Draw(page).rounded_rectangle((x-5, y-5, x+width+4, y+height+4),
                                          radius=radius+5, fill=edge)
    # System corners contain no content. No other screenshot pixels are retouched.
    mask = Image.new('L', shot.size)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width-1, height-1), radius=radius, fill=255)
    page.paste(shot, (x, y), mask)


def save(page, loc, device, name, title, body):
    folder = OUT / device / loc
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / name
    page.convert('RGB').save(path, optimize=True)
    MANIFEST.append({'file': str(path.relative_to(OUT)), 'size': list(page.size),
                     'language': loc, 'title': title, 'description': body})


COPY = {
    'en': [
        ('THE FIRST COLLECTION', 'Recordings\nfrom my travels',
         'Six recordings selected from years of travel.\nI’ll continue adding new recordings.'),
        ('CHANGSHA, CHINA / 2023', '50\nminutes of rain.',
         'Recorded under the eaves in Changsha in 2023.\nFifty minutes from that night.'),
        ('SLEEP TIMER', 'Choose when\nto stop',
         'Set 25, 45 or 60 minutes.\nThe countdown pauses when playback pauses.\nThe final ten seconds fade out.'),
        ('OFFLINE LISTENING', 'Listen offline',
         'This first collection is included in the app.\nNew recordings will be added in future updates.\nNo account or ads.')],
    'zh': [
        ('我的旅行录音', '历年录音选集\n第一部分',
         '从这些年的录音里先选出六段。\n之后会持续更新，加入新的声音。'),
        ('中国 · 长沙 / 2023', '50\n分钟的夜雨',
         '2023 年在长沙的屋檐下录制。\n这里收录了那晚五十分钟的雨声。'),
        ('睡眠定时', '设置播放时间',
         '可选 25、45 或 60 分钟。\n暂停播放时，倒计时也会暂停。\n最后十秒淡出。'),
        ('离线收听', '下载后离线收听',
         '首批六段录音已收录在 App 中。\n后续会通过更新加入更多录音。\n无需账号，没有广告。')]
}


def phones(lang, loc):
    colors = [(CREAM, INK, '#5e7160', '#d9e0cf'),
              ('#18313e', '#f2eee1', '#bac7c6', '#294653'),
              ('#eee0d0', '#492f32', '#82665b', '#cdb6a5'),
              ('#213c32', '#f0eddf', '#b8c4ae', '#385347')]
    names = ['01-personal-journal.png', '02-changsha-rain.png',
             '03-sleep-timer.png', '04-offline-library.png']
    for i, ((label, title, body), (bg, ink, muted, lower)) in enumerate(zip(COPY[lang], colors)):
        page = Image.new('RGBA', (1206, 2622), bg)
        d = ImageDraw.Draw(page)
        d.rectangle((0, 1160, 1206, 2622), fill=lower)
        brand(page, (76, 65), 91, ink)
        lines(page, (1014, 88), f'{i+1:02} / 04', 25, muted, 'label', max_width=120)
        lines(page, (80, 201), label, 26 if lang == 'en' else 30, muted, 'label', lang, max_width=1046)
        if i == 1:
            lines(page, (73, 264), '50', 252, ink, 'title', max_width=360)
            if lang == 'en':
                lines(page, (437, 295), 'minutes\nof rain.', 80, ink, 'title', leading=91, max_width=680)
            else:
                lines(page, (437, 310), '分钟的\n长沙夜雨', 75, ink, 'title', lang, leading=91, max_width=680)
        else:
            lines(page, (75, 282), title, 112 if lang == 'en' else 110,
                  ink, 'title', lang, leading=124, max_width=1056)
        lines(page, (81, 548), body, 38 if lang == 'en' else 40,
              muted, lang=lang, leading=51, max_width=1035)
        screen(page, f'{lang}{i+1:02}.png', (180, 745), 846, radius=40)
        save(page, loc, 'iPhone', names[i], title, body)


def duo_cover(lang, loc):
    page = Image.new('RGBA', (2034, 1398), CREAM)
    d = ImageDraw.Draw(page)
    d.rectangle((780, 0, 2034, 1398), fill='#203946')
    brand(page, (91, 93), 101, INK)
    label = 'IPHONE DUO / COVER DISPLAY' if lang == 'en' else 'iPhone Duo · 帐篷外屏'
    title = 'Cover display\nplayback' if lang == 'en' else '帐篷模式\n外屏播放'
    body = ('Play, pause and set a timer\nfrom the cover display.' if lang == 'en'
            else '横向摆放手机。\n在外屏播放、暂停和设置定时。')
    lines(page, (96, 258), label, 26 if lang == 'en' else 31, '#667565', 'label', lang, max_width=600)
    lines(page, (88, 363), title, 96 if lang == 'en' else 119,
          INK, 'title', lang, leading=144, max_width=650)
    lines(page, (96, 716), body, 36 if lang == 'en' else 36,
          '#55685d', lang=lang, leading=58, max_width=635)
    d.line((96, 927, 671, 927), fill='#b3bba9', width=2)
    lines(page, (96, 965), '25 / 45 / 60 / ∞', 44, INK, 'title', max_width=600)
    lines(page, (96, 1041), 'MINUTES OR NO LIMIT' if lang == 'en' else '睡眠定时或一直循环',
          24 if lang == 'en' else 29, '#667565', 'label', lang, max_width=600)
    lines(page, (97, 1297), 'STORY. / FIELD NOTES 05', 23, '#667565', 'label', max_width=600)
    screen(page, 'cover-active.png', (834, 292), 1134, edge='#10232c', radius=46)
    lines(page, (840, 1135), 'PLAYBACK CONTINUES WHEN YOU OPEN THE PHONE.' if lang == 'en' else '展开手机后播放继续',
          26 if lang == 'en' else 33, '#cbd4cd', 'label', lang, max_width=1110)
    save(page, loc, 'Duo', '01-tent-mode.png', title, body)


def duo_inner(lang, loc):
    page = Image.new('RGBA', (2007, 2853), '#e6e9e0')
    d = ImageDraw.Draw(page)
    brand(page, (122, 80), 116, INK)
    lines(page, (1590, 111), 'FIELD NOTES / 06', 27, '#627165', 'label', max_width=315)
    label = 'IPHONE DUO / OPEN DISPLAY' if lang == 'en' else 'iPhone Duo · 展开内屏'
    title = 'Playback across\nboth displays' if lang == 'en' else '展开后继续播放'
    body = ('Open the phone without stopping the sound or timer.\nChoose a full-screen player or a player with a playlist.' if lang == 'en'
            else '声音和睡眠倒计时会继续。\n可选全屏播放，或同时显示播放列表。')
    lines(page, (130, 252), label, 31 if lang == 'en' else 40, '#627165', 'label', lang, max_width=1735)
    lines(page, (120, 331), title, 154 if lang == 'en' else 159,
          INK, 'title', lang, leading=174, max_width=1750)
    lines(page, (132, 708), body, 44 if lang == 'en' else 47,
          '#52685e', lang=lang, leading=64, max_width=1730)
    d.rectangle((0, 974, 2007, 2853), fill='#29434a')
    screen(page, f'{lang}duo-inner.png', (350, 894), 1307, edge='#172e34', radius=61)
    lines(page, (132, 2804), 'SCENE + PLAYLIST' if lang == 'en' else '风景与声音库',
          24 if lang == 'en' else 30, '#cad3c6', 'label', lang, max_width=1740)
    save(page, loc, 'Duo', '02-open-display.png', title, body)


def previews():
    PREVIEW.mkdir(parents=True, exist_ok=True)
    for loc in ['en-US', 'zh-Hans']:
        paths = sorted((OUT/'iPhone'/loc).glob('*.png'))
        board = Image.new('RGB', (2080, 1127), '#faf8f3')
        for i, p in enumerate(paths):
            im = ImageOps.contain(Image.open(p), (500, 1087), Image.Resampling.LANCZOS)
            board.paste(im, (20+i*515, 20))
        board.save(PREVIEW/f'iPhone-{loc}.jpg', quality=95)
        cover = ImageOps.contain(Image.open(OUT/'Duo'/loc/'01-tent-mode.png'), (1220, 1100), Image.Resampling.LANCZOS)
        inner = ImageOps.contain(Image.open(OUT/'Duo'/loc/'02-open-display.png'), (780, 1100), Image.Resampling.LANCZOS)
        board = Image.new('RGB', (2060, 1140), '#faf8f3')
        board.paste(cover, (20, (1140-cover.height)//2))
        board.paste(inner, (1260, 20))
        board.save(PREVIEW/f'Duo-{loc}.jpg', quality=95)


if __name__ == '__main__':
    for lang, loc in [('en', 'en-US'), ('zh', 'zh-Hans')]:
        phones(lang, loc)
        duo_cover(lang, loc)
        duo_inner(lang, loc)
    (OUT/'manifest.json').write_text(json.dumps({'status': 'draft-not-uploaded',
        'concept': 'A personal travel journal in sound', 'images': MANIFEST}, ensure_ascii=False, indent=2)+'\n')
    previews()
    print(OUT)
    print(PREVIEW)
