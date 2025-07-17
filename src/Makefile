all: ../docs/hierojax.js ../docs/hierojaxedit.js ../docs/mdcconversion.js ../docs/resconversion.js ../docs/hierojaxedit16.js ../docs/hierojaxedit9.js texts jsons

../docs/hierojax.js: util.js syntax.js formatting.js insertions.js standardizedvariants.js ligatures.js main.js
	cp util.js ../docs/
	cat util.js > tmp.js
	echo ' '  >> tmp.js
	cat syntax.js >> tmp.js
	echo '\n '  >> tmp.js
	cat formatting.js >> tmp.js
	echo ' '  >> tmp.js
	cat insertions.js >> tmp.js
	echo ' '  >> tmp.js
	cat standardizedvariants.js >> tmp.js
	echo ' '  >> tmp.js
	cat ligatures.js >> tmp.js
	echo ' '  >> tmp.js
	cat main.js >> tmp.js
	mv tmp.js ../docs/hierojax.js

../docs/hierojax16.js: util.js syntax16.js formatting16.js insertions.js standardizedvariants.js ligatures.js main16.js
	cat util.js > tmp.js
	echo ' '  >> tmp.js
	cat syntax16.js >> tmp.js
	echo '\n '  >> tmp.js
	cat formatting16.js >> tmp.js
	echo ' '  >> tmp.js
	cat insertions.js >> tmp.js
	echo ' '  >> tmp.js
	cat standardizedvariants.js >> tmp.js
	echo ' '  >> tmp.js
	cat ligatures.js >> tmp.js
	echo ' '  >> tmp.js
	cat main16.js >> tmp.js
	mv tmp.js ../docs/hierojax16.js

../docs/hierojax9.js: util.js syntax9.js formatting9.js insertions.js standardizedvariants.js ligatures.js main9.js
	cat util.js > tmp.js
	echo ' '  >> tmp.js
	cat syntax9.js >> tmp.js
	echo '\n '  >> tmp.js
	cat formatting9.js >> tmp.js
	echo ' '  >> tmp.js
	cat insertions.js >> tmp.js
	echo ' '  >> tmp.js
	cat standardizedvariants.js >> tmp.js
	echo ' '  >> tmp.js
	cat ligatures.js >> tmp.js
	echo ' '  >> tmp.js
	cat main9.js >> tmp.js
	mv tmp.js ../docs/hierojax9.js

../docs/hierojaxedit.js: ../docs/hierojax.js unipoints.js extpoints.js signinfo.js edit.js
	cat ../docs/hierojax.js > tmp.js
	echo ' '  >> tmp.js
	cat unipoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat extpoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat signinfo.js >> tmp.js
	echo ' '  >> tmp.js
	cat edit.js >> tmp.js
	mv tmp.js ../docs/hierojaxedit.js

../docs/hierojaxedit16.js: ../docs/hierojax16.js unipoints.js extpoints.js signinfo.js edit16.js
	cat ../docs/hierojax16.js > tmp.js
	echo ' '  >> tmp.js
	cat unipoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat extpoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat signinfo.js >> tmp.js
	echo ' '  >> tmp.js
	cat edit16.js >> tmp.js
	mv tmp.js ../docs/hierojaxedit16.js

../docs/hierojaxedit9.js: ../docs/hierojax9.js unipoints.js extpoints.js signinfo.js edit9.js
	cat ../docs/hierojax9.js > tmp.js
	echo ' '  >> tmp.js
	cat unipoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat extpoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat signinfo.js >> tmp.js
	echo ' '  >> tmp.js
	cat edit9.js >> tmp.js
	mv tmp.js ../docs/hierojaxedit9.js

../docs/mdcconversion.js: ../docs/hierojax.js unipoints.js extpoints.js mdcnames.js mdcnamesunikemet.js mdcmnemonics.js mdcligatures.js mdcstructure.js mdcsyntax.js mdcconvert.js
	cat ../docs/hierojax.js > tmp.js
	echo ' '  >> tmp.js
	cat unipoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat extpoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat mdcnames.js >> tmp.js
	echo ' '  >> tmp.js
	cat mdcnamesunikemet.js >> tmp.js
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

../docs/resconversion.js: ../docs/hierojax.js unipoints.js extpoints.js resstructure.js ressyntax.js resconvert.js
	cat ../docs/hierojax.js > tmp.js
	echo ' '  >> tmp.js
	cat unipoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat extpoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat resstructure.js >> tmp.js
	echo ' '  >> tmp.js
	cat ressyntax.js >> tmp.js
	echo ' '  >> tmp.js
	cat resconvert.js >> tmp.js
	mv tmp.js ../docs/resconversion.js

jsons: insertions.json rotations.json ligatures.json

insertions.json: insertions.js
	cat convertinit.js insertions.js convertinsertions.js | js > insertions.json
	cp insertions.json ../docs/

rotations.json: rotations.js
	cat convertinit.js rotations.js convertrotations.js | js > rotations.json
	cp rotations.json ../docs/

ligatures.json: ligatures.js
	cat convertinit.js ligatures.js convertligatures.js | js > ligatures.json
	cp ligatures.json ../docs/

texts: ../docs/texts/hierojax.css ../docs/texts/hierojax.js ../docs/texts/NewGardiner.ttf

../docs/texts/hierojax.css: ../docs/hierojax.css
	cp ../docs/hierojax.css ../docs/texts/

../docs/texts/hierojax.js: ../docs/hierojax.js
	cp ../docs/hierojax.js ../docs/texts/

../docs/texts/NewGardiner.ttf: ../docs/NewGardiner.ttf
	cp ../docs/NewGardiner.ttf ../docs/texts/

clean:
	rm -f ../docs/util.js
	rm -f insertions.json
	rm -f rotations.json
	rm -f ligatures.json
	rm -f ../docs/insertions.json
	rm -f ../docs/rotations.json
	rm -f ../docs/ligatures.json
	rm -f ../docs/hierojax.js
	rm -f ../docs/hierojaxedit.js
	rm -f ../docs/mdcconversion.js
	rm -f ../docs/resconversion.js
	rm -f ../docs/hierojax16.js
	rm -f ../docs/hierojaxedit16.js
	rm -f ../docs/hierojax9.js
	rm -f ../docs/hierojaxedit9.js

syntax.js: syntax.jison
	jison -p lr syntax.jison

mdcsyntax.js: mdcsyntax.jison
	jison mdcsyntax.jison

ressyntax.js: ressyntax.jison
	jison -p lr ressyntax.jison

syntax16.js: syntax16.jison
	jison -p lr syntax16.jison

syntax9.js: syntax9.jison
	jison -p lr syntax9.jison
