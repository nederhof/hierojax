all: ../docs/hierojax.js ../docs/hierojaxedit.js

../docs/hierojax.js: util.js syntax.js formatting.js insertions.js rotations.js main.js
	cat util.js > hierojax.js
	echo ' '  >> hierojax.js
	cat syntax.js >> hierojax.js
	echo ' '  >> hierojax.js
	cat formatting.js >> hierojax.js
	echo ' '  >> hierojax.js
	cat insertions.js >> hierojax.js
	echo ' '  >> hierojax.js
	cat rotations.js >> hierojax.js
	echo ' '  >> hierojax.js
	cat main.js >> hierojax.js
	mv hierojax.js ../docs/

../docs/hierojaxedit.js: ../docs/hierojax.js unipoints.js edit.js
	cat ../docs/hierojax.js > hierojaxedit.js
	echo ' '  >> hierojax.js
	cat unipoints.js >> hierojaxedit.js
	echo ' '  >> hierojax.js
	cat edit.js >> hierojaxedit.js
	mv hierojaxedit.js ../docs/

clean:
	rm -f ../docs/hierojax.js
	rm -f ../docs/hierojaxedit.js

syntax.js: syntax.jison
	jison -p lr syntax.jison
