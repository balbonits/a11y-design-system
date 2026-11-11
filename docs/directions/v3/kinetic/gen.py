import sys; sys.path.insert(0,'../shared'); from tokgen import build
P={'scrim':'#06123F99','warm-50':'#FBF8F1','warm-100':'#F3EEE2','warm-200':'#E8E1D0','white':'#FFFFFF',
 'cobalt-950':'#06123F','cobalt-900':'#0A1B5C','cobalt-800':'#0E2580','cobalt-700':'#1434B8','cobalt-600':'#1D44D6','cobalt-500':'#3A5EE8',
 'cobalt-300':'#9AB0FF','cobalt-200':'#C2CFFF','cobalt-100':'#E4E9FB','slate-600':'#45507A','slate-300':'#C3C9E0','slate-400':'#8C96BE',
 'night-900':'#070F33','night-800':'#0D1844','night-700':'#152255',
 'red-700':'#C21807','red-800':'#9C1305','red-100':'#FCE3DD','red-400':'#FF6B57','red-300':'#FF8B7A','red-950':'#3B0E12',
 'green-700':'#0B6B37','green-300':'#6FE0A0','amber-800':'#8A4B00','amber-300':'#FFC861','crimson-700':'#A3122A','crimson-800':'#820E21','crimson-300':'#FF93A6','crimson-200':'#FFB3C0'}
L={'scrim':'scrim','color-bg':'warm-50','surface':'white','surface-muted':'warm-100','text':'cobalt-900','text-muted':'slate-600','border':'cobalt-700','border-subtle':'slate-300',
 'accent':'red-700','accent-hover':'red-800','accent-soft':'red-100','accent-contrast':'white','focus-ring-color':'cobalt-700',
 'success':'green-700','warning':'amber-800','danger':'crimson-700','danger-hover':'crimson-800','danger-contrast':'white','info':'cobalt-700',
 'highlight':'cobalt-700','highlight-contrast':'warm-50'}
D={'scrim':'scrim','color-bg':'night-900','surface':'night-800','surface-muted':'night-700','text':'warm-50','text-muted':'slate-300','border':'cobalt-300','border-subtle':'slate-600',
 'accent':'red-400','accent-hover':'red-300','accent-soft':'red-950','accent-contrast':'night-900','focus-ring-color':'cobalt-200',
 'success':'green-300','warning':'amber-300','danger':'crimson-300','danger-hover':'crimson-200','danger-contrast':'night-900','info':'cobalt-300',
 'highlight':'cobalt-600','highlight-contrast':'warm-50'}
SHAPE={'--font-display':"'Bricolage Grotesque', 'Arial Narrow', system-ui, sans-serif",'--font-body':"'Instrument Sans', system-ui, sans-serif",'--font-mono':"'IBM Plex Mono', ui-monospace, monospace",
 '--weight-display':'700','--weight-display-min':'300','--weight-display-max':'800',
 '--radius-lg':'0px','--radius-xl':'0px','--radius-md':'2px','--radius-sm':'0px','--radius-full':'2px','--border-width':'2px','--border-width-strong':'3px','--divider-shape':'none','--focus-ring-width':'3px','--focus-ring-offset':'3px','--focus-ring-style':'solid','--control-height':'48px','--control-padding-x':'1.3rem','--control-gap':'.6rem','--target-min':'44px','--tilt':'0deg','--rule':'1px',
 '--shadow-raised':'none','--shadow-overlay':'none','--shadow-press':'none','--blur-glass':'0px',
 '--duration-fast':'140ms','--duration-base':'260ms','--duration-slow':'480ms','--duration-reveal':'700ms','--stagger':'90ms',
 '--ease-standard':'cubic-bezier(.16,1,.3,1)','--ease-press':'cubic-bezier(.2,0,0,1)','--duration-ticker':'36s','--parallax-scale':'0','--lift':'0px','--weight-shift':'1'}
build('.', 'kinetic', 'D "kinetic", Kinetic Swiss',
 'Warm white paper, cobalt type and rules, one signal red for action. An asymmetric 12-column grid with lots of air and no cards: content is separated by hairline rules and whitespace. Dark mode is a cobalt night with warm white type.\n\nFonts: Bricolage Grotesque (variable display, 300 to 800), Instrument Sans (body), IBM Plex Mono (labels and data). References: Pentagram, Collins, Locomotive.',
 P,L,D,SHAPE,'--tilt: 0deg; --lift: 0px; --duration-fast: 0ms; --duration-base: 0ms; --duration-slow: 0ms; --duration-reveal: 0ms; --stagger: 0ms; --weight-shift: 0;',
 'Motion: headlines reveal line by line (`--duration-reveal`, `--stagger`), the display weight follows scroll between `--weight-display-min` and `--weight-display-max` (scaled by `--weight-shift`), and a marquee ticker runs on `--duration-ticker`. With reduced motion, every duration is 0, the weight stays at `--weight-display` and the ticker starts paused. The ticker always has a visible Pause button (WCAG 2.2.2).')
