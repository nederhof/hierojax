all: ../docs/hierojax.js ../docs/hierojaxedit.js ../docs/mdcconversion.js ../docs/resconversion.js ../docs/hierojaxedit16.js texts

../docs/hierojax.js: util.js syntax.js formatting.js insertions.js rotations.js ligatures.js main.js
	cp util.js ../docs/
	cat util.js > tmp.js
	echo ' '  >> tmp.js
	cat syntax.js >> tmp.js
	echo '\n '  >> tmp.js
	cat formatting.js >> tmp.js
	echo ' '  >> tmp.js
	cat insertions.js >> tmp.js
	echo ' '  >> tmp.js
	cat rotations.js >> tmp.js
	echo ' '  >> tmp.js
	cat ligatures.js >> tmp.js
	echo ' '  >> tmp.js
	cat main.js >> tmp.js
	mv tmp.js ../docs/hierojax.js

../docs/hierojax16.js: util.js syntax16.js formatting16.js insertions.js rotations.js ligatures.js main16.js
	cat util.js > tmp.js
	echo ' '  >> tmp.js
	cat syntax16.js >> tmp.js
	echo '\n '  >> tmp.js
	cat formatting16.js >> tmp.js
	echo ' '  >> tmp.js
	cat insertions.js >> tmp.js
	echo ' '  >> tmp.js
	cat rotations.js >> tmp.js
	echo ' '  >> tmp.js
	cat ligatures.js >> tmp.js
	echo ' '  >> tmp.js
	cat main16.js >> tmp.js
	mv tmp.js ../docs/hierojax16.js

../docs/hierojaxedit.js: ../docs/hierojax.js unipoints.js signinfo.js edit.js
	cat ../docs/hierojax.js > tmp.js
	echo ' '  >> tmp.js
	cat unipoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat signinfo.js >> tmp.js
	echo ' '  >> tmp.js
	cat edit.js >> tmp.js
	mv tmp.js ../docs/hierojaxedit.js

../docs/hierojaxedit16.js: ../docs/hierojax16.js unipoints.js signinfo.js edit16.js
	cat ../docs/hierojax16.js > tmp.js
	echo ' '  >> tmp.js
	cat unipoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat signinfo.js >> tmp.js
	echo ' '  >> tmp.js
	cat edit16.js >> tmp.js
	mv tmp.js ../docs/hierojaxedit16.js

../docs/mdcconversion.js: ../docs/hierojax.js unipoints.js mdcnames.js mdcmnemonics.js mdcligatures.js mdcstructure.js mdcsyntax.js mdcconvert.js
	cat ../docs/hierojax.js > tmp.js
	echo ' '  >> tmp.js
	cat unipoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat mdcnames.js >> tmp.js
	echo ' '  >> tmp.js
	cat mdcmnemonics.js >> tmp.js
	echo ' '  >> tmp.js
	cat mdcligatures.js >> tmp.js
	echo ' '  >> tmp.js
	cat mdcstructure.js >> tmp.js
	echo ' '  >> tmp.js
	cat mdcsyntax.js >> tmp.js
	echo ' '  >> tmp.js
	cat mdcconvert.js >> tmp.js
	mv tmp.js ../docs/mdcconversion.js

../docs/resconversion.js: ../docs/hierojax.js unipoints.js resstructure.js ressyntax.js resconvert.js
	cat ../docs/hierojax.js > tmp.js
	echo ' '  >> tmp.js
	cat unipoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat resstructure.js >> tmp.js
	echo ' '  >> tmp.js
	cat ressyntax.js >> tmp.js
	echo ' '  >> tmp.js
	cat resconvert.js >> tmp.js
	mv tmp.js ../docs/resconversion.js

insertions.js: insertions.json
	echo -n 'Shapes.insertions = ' > insertions.js
	cat insertions.json >> insertions.js
	cp insertions.json ../docs/

rotations.js: rotations.json
	echo -n 'Shapes.rotations = ' > rotations.js
	cat rotations.json >> rotations.js
	cp rotations.json ../docs/

ligatures.js: ligatures.json
	echo -n 'Shapes.ligatures = ' > ligatures.js
	cat ligatures.json >> ligatures.js
	cp ligatures.json ../docs/

texts: ../docs/texts/hierojax.css ../docs/texts/hierojax.js ../docs/texts/NewGardinerSMP.ttf

../docs/texts/hierojax.css: ../docs/hierojax.css
	cp ../docs/hierojax.css ../docs/texts/

../docs/texts/hierojax.js: ../docs/hierojax.js
	cp ../docs/hierojax.js ../docs/texts/

../docs/texts/NewGardinerSMP.ttf: ../docs/NewGardinerSMP.ttf
	cp ../docs/NewGardinerSMP.ttf ../docs/texts/

clean:
	rm -f ../docs/util.js
	rm -f insertions.js
	rm -f rotations.js
	rm -f ligatures.js
	rm -f ../docs/insertions.json
	rm -f ../docs/rotations.json
	rm -f ../docs/ligatures.json
	rm -f ../docs/hierojax.js
	rm -f ../docs/hierojaxedit.js
	rm -f ../docs/mdcconversion.js
	rm -f ../docs/resconversion.js
	rm -f ../docs/hierojax16.js
	rm -f ../docs/hierojaxedit16.js

syntax.js: syntax.jison
	jison -p lr syntax.jison

mdcsyntax.js: mdcsyntax.jison
	jison mdcsyntax.jison

ressyntax.js: ressyntax.jison
	jison -p lr ressyntax.jison

syntax16.js: syntax16.jison
	jison -p lr syntax16.jison


