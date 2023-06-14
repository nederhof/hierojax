%lex

INTEGER [0-9]+

%%

'[&'	return 'BRACKET-OPEN';
'&]'	return 'BRACKET-CLOSE';
'[{'	return 'BRACKET-OPEN';
'}]'	return 'BRACKET-CLOSE';
'[['	return 'BRACKET-OPEN';
']]'	return 'BRACKET-CLOSE';
'[\\'	return 'BRACKET-OPEN';
'\\]'	return 'BRACKET-CLOSE';
'["'	return 'BRACKET-OPEN';
'"]'	return 'BRACKET-CLOSE';
'[\''	return 'BRACKET-OPEN';
'\']'	return 'BRACKET-CLOSE';
'[('	return 'BRACKET-OPEN';
')]'	return 'BRACKET-CLOSE';
'[?'	return 'BRACKET-OPEN';
'?]'	return 'BRACKET-CLOSE';

'!!'[ \t\n\r\f_]*					return 'BREAK';
('+s-')?'!'('='{INTEGER}'%')?[ \t\n\r\f_]*	return 'BREAK';
'+s'[ \t\n\r\f_]*						return 'BREAK';
'+'[a-rt-z+]('\+'|[^+])*	return 'TEXT';
'|'[^|-]*					return 'LINE-NUMBER';
\{[lL]{INTEGER}\,{INTEGER}\}	return 'BREAK';
'?'{INTEGER}	return 'TAB';
'%clear'		return 'TAB';
'%{'[^}]*'}'	return 'TAB';
'zone{'[^}]*'}'	return 'ZONE';

'h/'	return 'WIDE-LOST';
'v/'	return 'TALL-LOST';

'PF'[0-9]'-'	return 'ARROW';

([A-Z]|Aa|Ff|NL|NU)[0-9]+[A-Za-z]*|[a-zA-Z]+|US[0-9A-Z]*|[0-9]+|'"'[^\"]+'"'|'`'	return 'SIGN';

'='		return 'EQUALS';

'^^^'	return 'ZONE-PRE';
'^^'	return 'ZONE-PRE';
'&&&'	return 'ZONE-POST';
'&&'	return 'ZONE-POST';
'{{'[0-9]+','[0-9]+','[0-9]+'}}'	return 'ABSOLUTE';
'**'	return 'ABSOLUTE-CONTINUATION';

'^'	return 'OMIT';

'\\r1'	return 'ROTATE-90';
'\\r2'	return 'ROTATE-180';
'\\r3'	return 'ROTATE-270';
'\\r4'	return 'ROTATE-360';
'\\t1'	return 'ROTATE-90-MIRROR';
'\\t2'	return 'ROTATE-180-MIRROR';
'\\t3'	return 'ROTATE-270-MIRROR';
'\\t4'	return 'ROTATE-360-MIRROR';
'\\R'{INTEGER}	return 'ROTATE-DEGREES';
'\\'{INTEGER}	return 'SCALE-PERCENTAGE';

'\\red'		return 'RED-GLYPH';
'\\'i		return 'GRAY-GLYPH';
'\\'l		return 'ELONGATE-GLYPH';
'\\shading'[1234]+	return 'GLYPH-SHADE';
'\\'[a-zA-Z]+[0-9]*	return 'IGNORED-MODIFIER';
'\\'		return 'MIRROR';

'..'	return 'FULL-BLANK';
'.'		return 'HALF-BLANK';
'//'	return 'LOST';
'/'	return 'HALF-LOST';

/* 1 = ts, 2 = te, 3 = bs, 4 = be */
'#'[1234]+	return 'QUADRAT-SHADE';

'-'?'#b'	return 'SHADE-ON';
'-'?'#e'	return 'SHADE-OFF';

'##'	return 'OVERLAY';
'#'		return 'OVERLAY';

'$r'	return 'RED';
'$b'	return 'BLACK';
'$'		return 'COLOR-TOGGLE';
'-'?'#'	return 'SHADE-TOGGLE';

/*
			cartouche
	S		serekh
	H		Hwt
	F		walled enclosure without caps
	0	0	plain cartouche without caps
	1	0	round cap at start
	2	0	knot at start
	h0	h1	Hwt missing start cap, no square
	h2	h3	Hwt, square at bottom and square at top
	s2	1	reverse serekh
*/
'<'[SFHsfh]?[bme]?[0123]?'-'	return 'BEGIN-ENCLOSURE';
'-'[SFHsfh]?[0123]?'>'			return 'END-ENCLOSURE';

'-'[ \t\n\r\f_]*	return 'SEP';
[ \t\n\r\f_]+		return 'SPACE';

'??'			return 'LACUNA';
'?'				return 'LACUNA';

'&'		return 'LIGATURE';

':'	return 'COLON';
'*'	return 'ASTERISK';
'('	return 'OPEN';
')'	return 'CLOSE';

<<EOF>>	return 'EOF';

/lex

%start mdc

%%

mdc
	: space top_items EOF
		{return new MdcLine($top_items);}
	;

top_items
	: seps
		{$$ = [$seps];}
	| top_items top_item seps
		{$$ = $top_items.concat($top_item, $seps);}
	;

seps
	: 
		{$$ = new MdcToggle();}
	| seps sep
		{$$ = $seps.extend($sep);}
	;

sep
	: SEP
		{$$ = { };}
	| toggle
		{$$ = $toggle;}
	;

top_item
	: BREAK
		{$$ = new MdcBreak(yytext);}
	| TEXT
		{$$ = new MdcText(yytext);}
	| LINE-NUMBER
		{$$ = new MdcLineNumber(yytext);}
	| ARROW
		{$$ = [];}
	| TAB
		{$$ = [];}
	| LACUNA
		{$$ = [];}
	| OMIT
		{$$ = [];}
	| ZONE
		{$$ = [];}
	| quadrat
		{$$ = $quadrat;}
	;

quadrat
	: vertical_group group_shading
		{$$ = new MdcQuadrat($vertical_group, $group_shading);}
	;

group_shading
	:
		{$$ = '';}
	| quadrat_shade space
		{$$ = $quadrat_shade;}
	;

quadrat_shade
	: QUADRAT-SHADE
		{$$ = yytext;}
	;

vertical_group
	: horizontal_group
		{$$ = new MdcVertical([$horizontal_group]);}
	| vertical_group COLON horizontal_group
		{$$ = $vertical_group.add($horizontal_group);}
	;

horizontal_group
	: horizontal_element
		{$$ = new MdcHorizontal([$horizontal_element]);}
	| horizontal_group ASTERISK horizontal_element
		{$$ = $horizontal_group.add($horizontal_element);}
	;

horizontal_element
	: inner_group ZONE-PRE hieroglyph ZONE-POST inner_group
		{$$ = new MdcComplex($inner_group1, $hieroglyph, $inner_group2);}
	| inner_group ZONE-PRE hieroglyph
		{$$ = new MdcComplex($inner_group, $hieroglyph, null);}
	| hieroglyph ZONE-POST inner_group
		{$$ = new MdcComplex(null, $hieroglyph, $inner_group);}
	| inner_group
		{$$ = $inner_group;}
	;

inner_group
	: hieroglyph
		{$$ = $hieroglyph;}
	| overlay
		{$$ = $overlay;}
	| ligature
		{$$ = $ligature;}
	| absolute
		{$$ = $absolute;}
	| OPEN top_items CLOSE space
		{$$ = new MdcVertical($top_items);}
	;

overlay
	: hieroglyph OVERLAY hieroglyph
		{$$ = new MdcOverlay($hieroglyph1, $hieroglyph2);}
	;

ligature
	: hieroglyph LIGATURE hieroglyph
		{$$ = new MdcLigature($hieroglyph1, $hieroglyph2);}
	| ligature LIGATURE hieroglyph
		{$$ = $ligature.add($hieroglyph);}
	;

absolute
	: hieroglyph ABSOLUTE-CONTINUATION hieroglyph
		{$$ = new MdcAbsolute($hieroglyph1, $hieroglyph2);}
	| absolute ABSOLUTE-CONTINUATION hieroglyph
		{$$ = $absolute.add($hieroglyph);}
	;

hieroglyph
	: grammar sign modifiers placement space
		{$$ = $sign.addModifiers($modifiers).addPlacement($placement);}
	| enclosure modifiers placement space
		{$$ = $enclosure.addModifiers($modifiers).addPlacement($placement);}
	;

space
	:
	| SPACE
	;

sign
	: SIGN
		{$$ = new MdcSign(yytext);}
	| FULL-BLANK
		{$$ = new MdcBlank(1);}
	| HALF-BLANK
		{$$ = new MdcBlank(0.5);}
	| LOST
		{$$ = new MdcLost(1, 1);}
	| HALF-LOST
		{$$ = new MdcLost(0.5, 0.5);}
	| TALL-LOST
		{$$ = new MdcLost(0.5, 1);}
	| WIDE-LOST
		{$$ = new MdcLost(1, 0.5);}
	| BRACKET-OPEN
		{$$ = new MdcBracketOpen(yytext);}
	| BRACKET-CLOSE
		{$$ = new MdcBracketClose(yytext);}
	;

placement
	:
		{$$ = null;}
	| ABSOLUTE
		{$$ = MdcParse.absolute(yytext);}
	;

grammar
	:
	| EQUALS
	;

enclosure
	: begin_enclosure top_items end_enclosure
		{$$ = new MdcEnclosure($begin_enclosure, $top_items, $end_enclosure);}
	;

begin_enclosure
	: BEGIN-ENCLOSURE
		{$$ = yytext.substring(1, yytext.length-1);}
	;

end_enclosure
	: END-ENCLOSURE
		{$$ = yytext.substring(1, yytext.length-1);}
	;

modifiers
	:
		{$$ = new MdcModifier();}
	| modifiers modifier
		{$$ = $modifiers.extend($modifier);}
	;

modifier
	: MIRROR
		{$$ = { mirror: true };}
	| ROTATE-90
		{$$ = { rotate: 90 };}
	| ROTATE-180
		{$$ = { rotate: 180 };}
	| ROTATE-270
		{$$ = { rotate: 270 };}
	| ROTATE-360
		{$$ = { };}
	| ROTATE-90-MIRROR
		{$$ = { rotate: 90, mirror: true };}
	| ROTATE-180-MIRROR
		{$$ = { rotate: 180, mirror: true };}
	| ROTATE-270-MIRROR
		{$$ = { rotate: 270, mirror: true };}
	| ROTATE-360-MIRROR
		{$$ = { mirror: true };}
	| ROTATE-DEGREES
		{$$ = { rotate: parseInt(yytext.substring(2)) };}
	| SCALE-PERCENTAGE
		{$$ = { };}
	| RED-GLYPH
		{$$ = { color: 'red' };}
	| GRAY-GLYPH
		{$$ = { };}
	| ELONGATE-GLYPH
		{$$ = { };}
	| GLYPH-SHADE
		{$$ = { shade: MdcParse.corners(yytext) };}
	| IGNORED-MODIFIER
		{$$ = { };}
	;

toggle
	: COLOR-TOGGLE
		{$$ = { color: 'toggle' };}
	| RED
		{$$ = { color: 'red' };}
	| BLACK
		{$$ = { color: 'black' };}
	| SHADE-TOGGLE
		{$$ = { shade: 'toggle' };}
	| SHADE-ON
		{$$ = { shade: 'on' };}
	| SHADE-OFF
		{$$ = { shade: 'off' };}
	;

%%

class MdcParse {
	static absolute(s) {
		const matched = s.match(/^{{([0-9]+),([0-9]+),([0-9]+)}}$/);
		if (matched)
			return { x: parseInt(matched[1]), y: parseInt(matched[2]), s: parseInt(matched[3]) };
		else
			return null;
	}
	static corners(s) {
		return { 
			ts: s.indexOf('1') >= 0,
			te: s.indexOf('2') >= 0,
			bs: s.indexOf('3') >= 0,
			be: s.indexOf('4') >= 0,
		};
	}
}
