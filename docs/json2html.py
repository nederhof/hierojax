# Use as:
# python3 json2html.py myinputfile.json myoutputfile.html
import json
import sys

pre = """<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>MY TEXT NAME</title>
<link rel="stylesheet" type="text/css" href="hierojax.css" />
<script type="text/javascript" src="hierojax.js"></script>
<script type="text/javascript">
    window.addEventListener("DOMContentLoaded", () => {
hierojax.processFragments(); });
</script>
</head>
<body>

<h1>MY TEXT NAME</h1>

<p>
MY DESCRIPTION OF TEXT
</p>

"""

post = """
</body>
</html>"""

def convert(infile, outfile):
	with open(infile) as jsonfile:
		data = json.load(jsonfile)
		with open(outfile, 'w') as htmlfile:
			htmlfile.write(pre)
			for line in data:
				for elem in line:
					if elem['type'] == 'black' or elem['type'] == 'red':
						s = elem['string']
						if elem['type'] == 'red':
							style = 'class="hierojax" data-type="svg" style="font-size: 30px; color: red;"'
							versestyle = 'style="font-size: 30px; color: red;"'
						else:
							style = 'class="hierojax" data-type="svg" style="font-size: 30px;"'
							versestyle = 'style="font-size: 30px;"'
						hierotag = '<span ' + style + '>'
						endtag = '</span>'
						versepoint = '<span ' + versestyle + '>&#x2022;</span>'
						# hack to replace versepoints by HTML elements
						s = s.replace('\ufffd', endtag + versepoint + hierotag)
						htmlfile.write(hierotag + s + endtag)
					elif elem['type'] == 'linenumber':
						s = elem['string']
						htmlfile.write('<span style="font-size: 10; font-weight: 700;">(' + s + ')</span> ')
					elif elem['type'] == 'text':
						s = elem['string']
						htmlfile.write('<p>' + s + '</p>\n')
				if len(line) != 1 or line[0]['type'] != 'linenumber':
					htmlfile.write('<br>\n')
			htmlfile.write(post)

if __name__ == "__main__":
	convert(sys.argv[1], sys.argv[2])
