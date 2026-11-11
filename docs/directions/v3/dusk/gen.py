import sys; sys.path.insert(0,'../shared'); from tokgen import build
P={'apricot-50':'#FFF6EE','apricot-100':'#FCE8D9','apricot-200':'#F8D6BE','apricot-300':'#FFC79E','apricot-400':'#FFB27A','white':'#FFFFFF',
 'plum-950':'#2E0F2D','plum-900':'#3D1340','plum-800':'#5A1D5C','plum-700':'#74296F','plum-600':'#8E3A86','plum-500':'#A65A9E','plum-200':'#E9CBE3','plum-100':'#F5E3EF',
 'mauve-600':'#6B4566','mauve-300':'#D9BED3','mauve-400':'#A8849F',
 'coral-700':'#A8402C','coral-500':'#E8664A','coral-400':'#FF8A6B','coral-300':'#FFA58C',
 'aub-950':'#1B0B1F','aub-900':'#24102A','aub-800':'#311837','aub-700':'#412247','aub-600':'#5A3060',
 'green-700':'#1F6B45','green-300':'#86DDB0','amber-800':'#8A4A06','amber-300':'#FFCB7A','rose-700':'#A8243F','rose-800':'#871C33','rose-300':'#FF9DB2','rose-200':'#FFBFCD','blue-700':'#2F5C9E','blue-300':'#A9C6FF'}
L={'color-bg':'apricot-50','surface':'white','surface-muted':'apricot-100','text':'plum-900','text-muted':'mauve-600','border':'plum-500','border-subtle':'apricot-200',
 'accent':'plum-700','accent-hover':'plum-800','accent-soft':'plum-100','accent-contrast':'white','focus-ring-color':'coral-700',
 'success':'green-700','warning':'amber-800','danger':'rose-700','danger-hover':'rose-800','danger-contrast':'white','info':'blue-700',
 'highlight':'coral-400','highlight-contrast':'plum-950'}
D={'color-bg':'aub-950','surface':'aub-900','surface-muted':'aub-800','text':'apricot-50','text-muted':'mauve-300','border':'mauve-400','border-subtle':'aub-600',
 'accent':'apricot-400','accent-hover':'apricot-300','accent-soft':'aub-700','accent-contrast':'aub-950','focus-ring-color':'coral-300',
 'success':'green-300','warning':'amber-300','danger':'rose-300','danger-hover':'rose-200','danger-contrast':'aub-950','info':'blue-300',
 'highlight':'coral-400','highlight-contrast':'aub-950'}
SHAPE={'--font-display':"'Young Serif', Georgia, serif",'--font-body':"'Nunito Sans', system-ui, sans-serif",'--font-mono':"'Nunito Sans', system-ui, sans-serif",
 '--weight-display':'400','--radius-lg':'32px','--radius-md':'999px','--radius-sm':'18px','--radius-full':'999px','--border-width':'1.5px','--border-width-strong':'2.5px','--divider-shape':'curve','--focus-ring-width':'3px','--focus-ring-offset':'3px','--focus-ring-style':'solid','--control-height':'48px','--control-padding-x':'1.4rem','--control-gap':'.6rem','--target-min':'44px','--tilt':'0deg',
 '--shadow-raised':'0 2px 6px rgb(61 19 64 / .08)','--shadow-overlay':'0 18px 48px -18px rgb(61 19 64 / .28)','--shadow-press':'none','--blur-glass':'0px',
 '--duration-fast':'200ms','--duration-base':'420ms','--duration-slow':'800ms','--duration-reveal':'1100ms',
 '--ease-standard':'cubic-bezier(.37,0,.17,1)','--ease-press':'cubic-bezier(.45,0,.2,1)','--duration-ticker':'0s','--parallax-scale':'0.12','--lift':'-2px','--hue-shift':'1'}
build('.', 'dusk', 'E "dusk", Soft Dusk',
 'Apricot paper, plum type, coral glow. Flowing curves, pills and generous radii, with sections that melt into each other through curved dividers instead of hard edges. Dark mode is a deep aubergine night with apricot accents.\n\nFonts: Young Serif (display) and Nunito Sans (body, humanist sans). References: Headspace, Calm, Lottie Files.',
 P,L,D,SHAPE,'--tilt: 0deg; --duration-fast: 0ms; --duration-base: 0ms; --duration-slow: 0ms; --duration-reveal: 0ms; --parallax-scale: 0; --lift: 0px; --hue-shift: 0;',
 'Motion: slow easing (`--ease-standard`), a scroll-driven hue shift on the decorative dusk gradient (`--hue-shift`, up to 40 degrees over the page), and gentle parallax on decorative curves (`--parallax-scale`). Nothing moves on its own, so no Pause control is needed (WCAG 2.2.2). Text never sits on the gradient; it sits on solid `--surface` or `--color-bg`. With reduced motion, durations, hue shift and parallax are all 0.')
