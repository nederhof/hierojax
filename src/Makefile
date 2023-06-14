all: ../docs/hierojax.js ../docs/hierojaxedit.js ../docs/mdcconversion.js

../docs/hierojax.js: util.js syntax.js formatting.js insertions.js rotations.js main.js
	cp util.js ../docs/
	cp insertions.js ../docs/
	cp rotations.js ../docs/
	cat util.js > tmp.js
	echo ' '  >> tmp.js
	cat syntax.js >> tmp.js
	echo ' '  >> tmp.js
	cat formatting.js >> tmp.js
	echo ' '  >> tmp.js
	cat insertions.js >> tmp.js
	echo ' '  >> tmp.js
	cat rotations.js >> tmp.js
	echo ' '  >> tmp.js
	cat main.js >> tmp.js
	mv tmp.js ../docs/hierojax.js
	cp ../docs/hierojax.css ../docs/texts/
	cp ../docs/hierojax.js ../docs/texts/
	cp ../docs/NewGardinerSMP.ttf ../docs/texts/

../docs/hierojaxedit.js: ../docs/hierojax.js unipoints.js edit.js
	cat ../docs/hierojax.js > tmp.js
	echo ' '  >> tmp.js
	cat unipoints.js >> tmp.js
	echo ' '  >> tmp.js
	cat edit.js >> tmp.js
	mv tmp.js ../docs/hierojaxedit.js

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

clean:
	rm -f ../docs/util.js
	rm -f ../docs/insertions.js
	rm -f ../docs/rotations.js
	rm -f ../docs/hierojax.js
	rm -f ../docs/hierojaxedit.js
	rm -f ../docs/mdcconversion.js

syntax.js: syntax.jison
	jison -p lr syntax.jison

mdcsyntax.js: mdcsyntax.jison
	jison mdcsyntax.jison
