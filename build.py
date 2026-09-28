"""Inlines css/style.css and js/*.js into template.html -> index.html (a single, self-contained page)."""
import re, pathlib
r = pathlib.Path(__file__).parent
t = (r/'template.html').read_text(encoding='utf8')
css = (r/'css/style.css').read_text(encoding='utf8')
t = re.sub(r'<link rel="stylesheet" href="css/style.css">', lambda m: '<style>\n'+css+'\n</style>', t)
t = re.sub(r'<script src="(js/[\w.]+)"></script>', lambda m: '<script>\n'+(r/m.group(1)).read_text(encoding='utf8')+'\n</script>', t)
(r/'index.html').write_text(t, encoding='utf8')
print('built index.html', len(t)//1024, 'KB')
