%lex

%%

"empty"				return 'EMPTY';
"stack"				return 'STACK';
"insert"			return 'INSERT';
"modify"			return 'MODIFY';

([A-I]|[K-Z]|(Aa)|(NL)|(NU))([1-9]([0-9][0-9]?)?)[a-z]?	return 'GLYPH_NAME';
[a-zA-Z]+									return 'NAME';
\"([^\t\n\r\f\b\"\\]|(\\\")|(\\\\))\"		return 'SHORT_STRING';
\"([^\t\n\r\f\b\"\\]|(\\\")|(\\\\)){2,}\"	return 'LONG_STRING';
[0-9]?\.[0-9][0-9]?							return 'REAL';
(0|([1-9]([0-9][0-9]?)?))					return 'NAT';

"-"					return 'MINUS';
":"					return 'COLON';
"("					return 'OPEN';
")"					return 'CLOSE';
"*"					return 'ASTERISK';
"."					return 'PERIOD';
","					return 'COMMA';
"^"					return 'CARET';
"!"					return 'EXCLAM';
"["					return 'SQ_OPEN';
"]"					return 'SQ_CLOSE';
"="					return 'EQUALS';
[ \t\n\r\f]			return 'WHITESPACE';

<<EOF>>				return 'EOF';

/lex

%start res

%%

res
	: whitespaces opt_header switches opt_hieroglyphic EOF
		{return new ResFragment($opt_header, $switches, $opt_hieroglyphic);}
	;

opt_header
	:   
		{$$ = [];}
	| header
		{$$ = $header;}
	;

header
	: arg_bracket_list whitespaces
		{$$ = $arg_bracket_list;}
	;

opt_hieroglyphic
	:   
		{$$ = null;}
	| hieroglyphic
		{$$ = $hieroglyphic;}
	;

hieroglyphic
	: top_group
		{$$ = new ResHiero($top_group);}
	| hieroglyphic MINUS opt_arg_bracket_list ws top_group
		{$$ = $hieroglyphic.addGroup($opt_arg_bracket_list, $ws, $top_group);}
	;

top_group
	: ver_group
		{$$ = $ver_group;}
	| hor_group
		{$$ = $hor_group;}
	| basic_group
		{$$ = $basic_group;}
	;

ver_group
	: ver_subgroup COLON opt_arg_bracket_list ws ver_subgroup
		{$$ = new ResVerGroup($ver_subgroup1, $opt_arg_bracket_list, $ws, $ver_subgroup2);}
	| ver_group COLON opt_arg_bracket_list ws ver_subgroup
		{$$ = $ver_group.addGroup($opt_arg_bracket_list, $ws, $ver_subgroup);}
	;

ver_subgroup 
	: hor_group
		{$$ = new ResVerSubgroup(new ResSwitch([]), $hor_group, new ResSwitch([]));}
	| OPEN ws hor_group CLOSE ws
		{$$ = new ResVerSubgroup($ws1, $hor_group, $ws2);}
	| basic_group
		{$$ = new ResVerSubgroup(new ResSwitch([]), $basic_group, new ResSwitch([]));}
	;

hor_group
	: hor_subgroup ASTERISK opt_arg_bracket_list ws hor_subgroup
		{$$ = new ResHorGroup($hor_subgroup1, $opt_arg_bracket_list, $ws, $hor_subgroup2);}
	| hor_group ASTERISK opt_arg_bracket_list ws hor_subgroup
		{$$ = $hor_group.addGroup($opt_arg_bracket_list, $ws, $hor_subgroup);}
	;

hor_subgroup 
	: OPEN ws ver_group CLOSE ws
		{$$ = new ResHorSubgroup($ws1, $ver_group, $ws2);}
	| basic_group
		{$$ = new ResHorSubgroup(new ResSwitch([]), $basic_group, new ResSwitch([]));}
	;

basic_group
	: named_glyph
		{$$ = $named_glyph;}
	| empty_glyph
		{$$ = $empty_glyph;}
	| box
		{$$ = $box;}
	| stack
		{$$ = $stack;}
	| insert
		{$$ = $insert;}
	| modify
		{$$ = $modify;}
	;

named_glyph
	: glyph_name opt_arg_bracket_list whitespaces notes switches
		{$$ = new ResNamedglyph($glyph_name, $opt_arg_bracket_list, $notes, $switches);}
	| name opt_arg_bracket_list whitespaces notes switches
		{$$ = new ResNamedglyph($name, $opt_arg_bracket_list, $notes, $switches);}
	| nat opt_arg_bracket_list whitespaces notes switches
		{$$ = new ResNamedglyph(String($nat), $opt_arg_bracket_list, $notes, $switches);}
	| short_string opt_arg_bracket_list whitespaces notes switches
		{$$ = new ResNamedglyph($short_string, $opt_arg_bracket_list, $notes, $switches);}
	;

empty_glyph
	: EMPTY opt_arg_bracket_list whitespaces opt_note switches
		{$$ = new ResEmptyglyph($opt_arg_bracket_list, $opt_note, $switches);}
	| PERIOD whitespaces opt_note switches
		{$$ = new ResEmptyglyph(ResEmptyglyph.pointArgs(), $opt_note, $switches);}
	;

box
	: name opt_arg_bracket_list whitespaces 
				OPEN ws opt_hieroglyphic CLOSE 
				whitespaces notes switches
		{$$ = new ResBox($name, $opt_arg_bracket_list, $ws, $opt_hieroglyphic, $notes, $switches);}
	;

stack
	: STACK opt_arg_bracket_list whitespaces
				OPEN ws top_group COMMA ws top_group CLOSE ws
		{$$ = new ResStack($opt_arg_bracket_list, $ws1, $top_group1, $ws2, $top_group2, $ws3);}
	;
	
insert
	: INSERT opt_arg_bracket_list whitespaces
				OPEN ws top_group COMMA ws top_group CLOSE ws
		{$$ = new ResInsert($opt_arg_bracket_list, $ws1, $top_group1, $ws2, $top_group2, $ws3);}
	;

modify
	: MODIFY opt_arg_bracket_list whitespaces
				OPEN ws top_group CLOSE ws
		{$$ = new ResModify($opt_arg_bracket_list, $ws1, $top_group, $ws2);}
	;

opt_note
	:   
		{$$ = null;}
	| note
		{$$ = $note;}
	;

notes 
	:   
		{$$ = [];}
	| notes note
		{$$ = $notes.concat($note);}
	;

note 
	: CARET string opt_arg_bracket_list whitespaces
		{$$ = new ResNote($string, $opt_arg_bracket_list);}
	;

ws 
	: whitespaces switches
		{$$ = $switches;}
	;

switches 
	:  
		{$$ = new ResSwitch([]);}
	| switch switches
		{$$ = $switch.join($switches);}
	;

switch 
	: EXCLAM opt_arg_bracket_list whitespaces
		{$$ = new ResSwitch($opt_arg_bracket_list);}
	;

opt_arg_bracket_list
	: 
		{$$ = [];}
	| arg_bracket_list
		{$$ = $arg_bracket_list;}
	;

arg_bracket_list
	: SQ_OPEN whitespaces opt_arg_list SQ_CLOSE
		{$$ = $opt_arg_list;}
	;

opt_arg_list
	:
		{$$ = [];}
	| arg_list
		{$$ = $arg_list;}
	;

arg_list
	: arg whitespaces
		{$$ = [$arg];}
	| arg_list COMMA whitespaces arg whitespaces
		{$$ = $arg_list.concat($arg);}
	;

arg
	: name EQUALS name
		{$$ = new ResArg($name1, $name2);}
	| name EQUALS nat
		{$$ = new ResArg($name, $nat);}
	| name EQUALS real
		{$$ = new ResArg($name, $real);}
	| name
		{$$ = new ResArg($name, null);}
	| nat
		{$$ = new ResArg($nat, null);}
	| real
		{$$ = new ResArg($real, null);}
	;

whitespaces 
	:
	| whitespaces WHITESPACE
	;

glyph_name
	: GLYPH_NAME
		{$$ = yytext;}
	;

name
	: NAME
		{$$ = yytext;}
	;

short_string
	: SHORT_STRING
		{$$ = yytext;}
	;

string
	: LONG_STRING
		{$$ = yytext;}
	| SHORT_STRING
		{$$ = yytext;}
	;

real
	: REAL
		{$$ = parseFloat(yytext);}
	;

nat
	: NAT
		{$$ = parseInt(yytext);}
	;
