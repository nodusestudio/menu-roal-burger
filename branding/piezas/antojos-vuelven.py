# Pieza "Los mejores antojos siempre vuelven" (1080x1350). Uso: python antojos-vuelven.py [Nombre]
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
nombre = sys.argv[1] if len(sys.argv)>1 else 'Josimar'
W,H=1080,1350
ROOT='C:/Users/ASUS/Documents/NODUS ESTUDIO/PROGRAMAS/menu-roal-burger-main/'
# fondo: degradado radial marron con brillo naranja detras de la hamburguesa
yy,xx=np.mgrid[0:H,0:W].astype(float)
d=np.sqrt(((xx-W/2)/(W*0.75))**2+((yy-H*0.58)/(H*0.55))**2)
t=np.clip(d,0,1)
c0=np.array([112,52,14]); c1=np.array([14,7,3])
bg=(c0[None,None,:]*(1-t[...,None])**1.3+c1[None,None,:]*(1-(1-t[...,None])**1.3)).clip(0,255).astype(np.uint8)
img=Image.fromarray(bg,'RGB').convert('RGBA')
# foto
ph=Image.open(ROOT+'productos-img/burger-premium-papuda.webp').convert('RGB').resize((1140,1140),Image.LANCZOS)
ph=ph.crop((30,150,1110,1000))  # 1080x850
mask=np.ones((850,1080),float)
fy=np.linspace(0,1,850)[:,None]; fx=np.linspace(0,1,1080)[None,:]
mask*=np.clip(fy/0.28,0,1)            # desvanece arriba
mask*=np.clip((1-fy)/0.16,0,1)        # y abajo
mask*=np.clip(np.minimum(fx,1-fx)/0.10,0,1)
mask=np.clip(mask,0,1)**1.2
pm=Image.fromarray((mask*255).astype(np.uint8))
img.paste(ph,(0,470),pm)
g=np.zeros((H,W,4),np.uint8); gy=np.clip((np.arange(H)-1060)/260,0,1)**1.4
g[...,3]=(gy[:,None]*215).astype(np.uint8).repeat(W,1); g[...,:3]=(12,6,2)
img.alpha_composite(Image.fromarray(g,'RGBA'))
dr=ImageDraw.Draw(img)
# logo
logo=Image.open(ROOT+'branding/logo/roal-logo-horizontal-blanco.png')
lw=500; logo=logo.resize((lw,int(logo.height*lw/logo.width)),Image.LANCZOS)
img.alpha_composite(logo,((W-lw)//2,58))
# textos
imp=lambda s:ImageFont.truetype('C:/Windows/Fonts/impact.ttf',s)
sg=lambda s:ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf',s)
def ctext(y,s,f,fill,sh=True):
    w=dr.textlength(s,font=f); x=(W-w)/2
    if sh: dr.text((x+3,y+4),s,font=f,fill=(0,0,0,150))
    dr.text((x,y),s,font=f,fill=fill)
ORG=(255,122,24); CRE=(255,244,226)
ctext(262,f'{nombre},',sg(46),ORG)
ctext(318,'LOS MEJORES ANTOJOS',imp(112),CRE)
ctext(432,'SIEMPRE VUELVEN',imp(112),ORG)
# boton CTA
bx0,bx1,by0,by1=250,830,1148,1244
sh=Image.new('RGBA',(W,H),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle((bx0,by0+8,bx1,by1+8),48,fill=(0,0,0,150))
img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
dr=ImageDraw.Draw(img)
dr.rounded_rectangle((bx0,by0,bx1,by1),48,fill=ORG)
f=sg(44); s='PIDE AHORA  ›'
w=dr.textlength(s,font=f); dr.text(((W-w)/2,by0+20),s,font=f,fill=(20,8,2))
ctext(1272,'roalburger.com  ·  Armenia, Quindío',sg(32),(255,214,170),sh=False)
out=ROOT+'branding/piezas/antojos-vuelven-1080x1350.png'
img.convert('RGB').save(out); print(out)
