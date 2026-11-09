#!/usr/bin/env python3
"""Render the reviewed project-category tree as an animated, self-contained SVG.

The two repositories share this renderer and data/system-map.json. Run this
file in the portfolio checkout to refresh the marked inline artwork; the
profile's build_profile.py writes its themed image variants.
"""
from html import escape
from pathlib import Path
import json
import re

PALETTES = {
    'dark': {'bg':'#0b0d17','surface':'#111525','ink':'#eff1ff','muted':'#a7b0cb','line':'#30364f','accent':'#b6a0ff','cyan':'#65d9ed','pink':'#ee9bc8','green':'#8bddc4'},
    'light': {'bg':'#faf9ff','surface':'#f0edf9','ink':'#232339','muted':'#565e77','line':'#d2d3e4','accent':'#6743b4','cyan':'#086d85','pink':'#a93072','green':'#24755f'},
}

def render_system_map(data, theme='dark', portrait=False, interactive=False):
    colors = PALETTES[theme]
    width, height = (360, 990) if portrait else (1000, 650)
    prefix = f'sm-{theme}-'+('portrait' if portrait else 'wide')
    projects = [p for branch in data['branches'] for p in branch['projects']]
    assert len(projects) == 6 and len({p['repo'] for p in projects}) == 6
    assert len(data['branches']) == 4
    def txt(x,y,value,size=14,color='ink',extra=''):
        return f'<text class="sm-type" x="{x}" y="{y}" font-size="{size}" fill="{colors[color]}" {extra}>{escape(value)}</text>'
    def path(d,color='line',extra=''):
        return f'<path d="{d}" fill="none" stroke="{colors[color]}" {extra}/>'
    def signal(d,color,index):
        return (path(d,color,'stroke-width="1.2" opacity=".38"')+
                path(d,color,f'class="sm-signal" pathLength="100" stroke-width="2.4" stroke-linecap="round" style="animation-delay:-{index*1.1:.1f}s"'))
    def panel(x,y,w,h,color='line',extra=''):
        return f'<path class="sm-panel" d="M{x+9} {y}H{x+w}V{y+h-9}L{x+w-9} {y+h}H{x}V{y+9}Z" fill="{colors["surface"]}" stroke="{colors[color]}" {extra}/>'
    def node(project,x,y,color,index):
        w,h = (260,86) if portrait else (280,105)
        b=panel(x,y,w,h,extra='stroke-width="1"')
        b+=path(f'M{x} {y+21}V{y+9}L{x+9} {y}H{x+34}',color,'stroke-width="2"')
        b+=txt(x+17,y+29,project['name'],20 if portrait else 19)
        b+=txt(x+17,y+51,project['description'],13 if portrait else 14,'muted')
        b+=txt(x+17,y+72,project['stack'],11 if portrait else 12,color)
        if not portrait:
            b+=txt(x+w-15,y+90,f'{project["number"]:02}',10,'muted','text-anchor="end"')
        if interactive:
            b+=txt(x+w-14,y+27,'↗',13,color,'text-anchor="end"')
            attrs=f'href="https://github.com/araxis07/{escape(project["repo"],quote=True)}" data-case-study-open="{escape(project["case_study"],quote=True)}" aria-haspopup="dialog" aria-label="{escape(project["name"],quote=True)} — open case study"'
            return f'<a class="sm-project" {attrs}>{b}</a>'
        return f'<g>{b}</g>'
    def category(branch,x,y):
        count=len(branch['projects'])
        return txt(x,y,branch['label'],12,branch['color'],'letter-spacing="1.1"')+txt(x,y+17,f'{count:02} '+('PROJECTS' if count>1 else 'PROJECT'),10,'muted','letter-spacing="1"')
    style='''
    .sm-type{font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace}
    .sm-signal{stroke-dasharray:3 97;animation:sm-travel 6.5s linear infinite}
    .sm-orbit{transform-box:fill-box;transform-origin:center;animation:sm-spin 28s linear infinite}
    .sm-orbit-reverse{animation-direction:reverse;animation-duration:36s}
    .sm-pulse{animation:sm-pulse 5s ease-in-out infinite}
    .sm-project{cursor:pointer;text-decoration:none}
    .sm-project .sm-panel{transition:stroke .2s,fill .2s}
    .sm-project:hover .sm-panel,.sm-project:focus-visible .sm-panel{stroke:CURRENT_ACCENT;stroke-width:2}
    .sm-project:focus-visible{outline:none}
    @keyframes sm-travel{to{stroke-dashoffset:-100}}
    @keyframes sm-spin{to{transform:rotate(360deg)}}
    @keyframes sm-pulse{50%{opacity:.35}}
    @media(prefers-reduced-motion:reduce){.sm-signal,.sm-orbit,.sm-pulse{animation:none}.sm-signal{stroke-dasharray:none;opacity:.12}}
    '''.replace('CURRENT_ACCENT',colors['cyan'])
    body=f'<rect width="{width}" height="{height}" fill="{colors["bg"]}"/>'
    body+=f'<defs><pattern id="{prefix}-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="{colors["line"]}" stroke-width=".5" opacity=".25"/></pattern><radialGradient id="{prefix}-halo"><stop stop-color="{colors["accent"]}" stop-opacity=".15"/><stop offset="1" stop-color="{colors["bg"]}" stop-opacity="0"/></radialGradient></defs>'
    body+=f'<rect x="20" y="48" width="{width-40}" height="{height-78}" fill="url(#{prefix}-grid)"/>'
    body+=txt(20 if portrait else 48,27,'PROJECT CONSTELLATION',11,'accent','letter-spacing="1.5"')
    if not portrait:body+=txt(952,27,'04 BRANCHES / 06 PROJECTS',11,'muted','text-anchor="end" letter-spacing="1"')
    body+=path(f'M{20 if portrait else 48} 44H{width-(20 if portrait else 48)}')
    if portrait:
        body+=path('M52 178V910','line','stroke-dasharray="2 7"')
        top=[(222,[242,344]),(458,[478]),(592,[612,714]),(828,[848])]
        index=0
        for branch,(label_y,rows) in zip(data['branches'],top):
            body+=category(branch,80,label_y)
            body+=f'<circle cx="52" cy="{label_y+6}" r="4" fill="{colors[branch["color"]]}"/>'
            for project,y in zip(branch['projects'],rows):
                body+=signal(f'M52 178V{y+27}Q52 {y+43} 68 {y+43}H80',branch['color'],index)
                body+=node(project,80,y,branch['color'],index);index+=1
        body+=panel(20,66,320,112,'accent')
        cx,cy=71,122
        body+=txt(126,107,data['root'],20,'accent')
        body+=txt(126,132,'PORTFOLIO INDEX',11,'muted','letter-spacing="1"')
        body+=txt(126,155,'06 PROJECTS / 04 DOMAINS',11,'muted')
        footer_y=961
        body+=txt(20,footer_y,'Categories connect a portfolio of projects.',11,'muted')
    else:
        body+=f'<ellipse cx="500" cy="328" rx="260" ry="260" fill="url(#{prefix}-halo)"/>'
        for r in [110,178,250]:body+=f'<circle cx="500" cy="328" r="{r}" fill="none" stroke="{colors["line"]}" opacity=".4" stroke-dasharray="2 10"/>'
        positions=[('web',48,88,[116,249]),('data',48,440,[468]),('travel',672,88,[116,249]),('terminal',672,440,[468])]
        index=0
        for branch,(_,x,label_y,rows) in zip(data['branches'],positions):
            body+=category(branch,x,label_y)
            left=x<500
            start_x,end_x,rail = (390,328,354) if left else (610,672,646)
            start_y=310 if len(rows)==2 else 365
            bend_x=start_x+(-20 if left else 20)
            for project,y in zip(branch['projects'],rows):
                center=y+52.5
                d=f'M{start_x} {start_y}H{bend_x}Q{rail} {start_y} {rail} {start_y-16 if len(rows)==2 else start_y+16}V{center}H{end_x}'
                body+=signal(d,branch['color'],index)
                body+=f'<circle cx="{rail}" cy="{center}" r="3" fill="{colors[branch["color"]]}"/>'
                body+=node(project,x,y,branch['color'],index);index+=1
        body+=panel(390,279,220,116,'accent')
        body+=txt(500,309,'PORTFOLIO INDEX',10,'muted','text-anchor="middle" letter-spacing="1.4"')
        body+=txt(500,338,data['root'],21,'accent','text-anchor="middle"')
        body+=txt(500,365,'06 projects / 04 domains',11,'muted','text-anchor="middle"')
        body+=f'<circle cx="500" cy="386" r="2" fill="{colors["cyan"]}" class="sm-pulse"/>'
        cx,cy=500,222
        body+=path('M48 611H952')+txt(48,633,'ROOT → PRODUCT FOCUS → SELECTED PROJECT',10,'muted','letter-spacing="1.1"')
        body+=txt(952,633,'PORTFOLIO CATEGORY MAP',10,'muted','text-anchor="end" letter-spacing="1"')
    for r,dash,cls,color in [(33,'3 10','sm-orbit','cyan'),(44,'24 12 1 12','sm-orbit sm-orbit-reverse','accent')]:
        body+=f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{colors[color]}" stroke-width="1" opacity=".65" stroke-dasharray="{dash}" class="{cls}"/>'
    body+=f'<path d="M{cx} {cy-21}L{cx+18} {cy-10}V{cy+11}L{cx} {cy+22}L{cx-18} {cy+11}V{cy-10}ZM{cx-18} {cy-10}L{cx} {cy+1}L{cx+18} {cy-10}M{cx} {cy+1}V{cy+22}" fill="{colors["surface"]}" stroke="{colors["cyan"]}" stroke-width="1.4"/>'
    description='Projects grouped by product focus. '+ '; '.join(branch['label'].title()+': '+', '.join(p['name'] for p in branch['projects']) for branch in data['branches'])+'.'
    role='group' if interactive else 'img'
    return f'<svg xmlns="http://www.w3.org/2000/svg" class="system-map-art '+('system-map-portrait' if portrait else 'system-map-wide')+f'" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="{role}" aria-labelledby="{prefix}-title {prefix}-desc"><title id="{prefix}-title">System Map — six featured projects</title><desc id="{prefix}-desc">{escape(description)}</desc><style>{style}</style>{body}</svg>\n'

def build_portfolio(root):
    data=json.loads((root/'data/system-map.json').read_text())
    artwork=render_system_map(data,interactive=True)+render_system_map(data,portrait=True,interactive=True)
    fragment='''<!-- SYSTEM MAP START -->
          <details class="system-map-panel" id="system-map" open>
            <summary><span><strong>System map</strong><span class="system-map-meta">4 branches · 6 projects</span></span><span class="system-map-toggle" aria-hidden="true"></span></summary>
            <div class="system-map-canvas">'''+artwork+'''</div>
            <p class="system-map-caption">Explore the branches. Select a project to open its case study.</p>
          </details>
          <!-- SYSTEM MAP END -->'''
    page=root/'index.html';content=page.read_text()
    if '<!-- SYSTEM MAP START -->' in content:
        content=re.sub(r'<!-- SYSTEM MAP START -->[\s\S]*?<!-- SYSTEM MAP END -->',lambda _:fragment,content)
    else:
        marker='<div class="projects-grid">'
        assert content.count(marker)==1
        content=content.replace(marker,fragment+'\n\n          '+marker)
    page.write_text(content)

if __name__=='__main__':
    root=Path(__file__).resolve().parents[1]
    if not (root/'index.html').is_file():
        raise SystemExit('Run scripts/build_profile.py to build the profile artwork.')
    build_portfolio(root)
    print('Updated the inline System Map from data/system-map.json.')
