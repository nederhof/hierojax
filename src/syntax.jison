%options flex

%lex

/*
 * OPENING_CHAR	[\u13258\u13259\u1325A\u13286\u13288\u13379\u1342F]
 * CLOSING_CHAR	[\u1325B\u1325C\u1325D\u13282\u13287\u13289\u1337A\u1337B]
 * DAMAGED_CHAR	[\u13447-\u13455]
 * converted to UTF-16 using:
 * https://www.cyberdefinitions.com/symbols/converting-hexadecimal-to-UTF-16-format-for-JavaScript.html
 */
OPENING_CHAR	\uD80C[\uDE58\uDE59\uDE5A\uDE86\uDE88\uDF79]|\uD80D\uDC2F
CLOSING_CHAR	\uD80C[\uDE5B\uDE5C\uDE5D\uDE82\uDE87\uDE89\uDF7A\uDF7B]
DAMAGED_CHAR	\uD80D[\uDC47-\uDC55]
BEGIN_ENCLOSURE_CHAR \uD80D[\uDC3C\uDC3E]
END_ENCLOSURE_CHAR \uD80D[\uDC3D\uDC3F]

%%

[\[{⟨⟦⸢]	return 'BRACKET_OPEN';
[\]}⟩⟧⸣]	return 'BRACKET_CLOSE';
[\uFE00-\uFE06]		return 'VS';
/* [\u{13000}-\u{13257}\u{1325E}-\u{13281}\u{13283}-\u{13285}\u{1328A}-\u{13378}\u{1337C}-\u{1342E}\u{13460}-\u{143FA}]
 * converted to UTF-16 using:
 * https://www.cyberdefinitions.com/symbols/converting-hexadecimal-to-UTF-16-format-for-JavaScript.html
 * Easier in js:
 * String.fromCodePoint(0x13000).split('')
 */
\uD80C[\uDC00-\uDE57\uDE5E-\uDE81\uDE83-\uDE85\uDE8A-\uDF78\uDF7C-\uDFFF]|\uD80D[\uDC00-\uDC2E\uDC60-\uDFFF]|\uD80E[\uDC00-\uDFFF]|\uD80F[\uDC00-\uDFFF]|\uD810[\uDC00-\uDFFA]|\uFFFD return 'SIGN';

'\uD80D\uDC30'	return 'VER';
'\uD80D\uDC31'	return 'HOR';
'\uD80D\uDC32'	return 'INSERT_TS';
'\uD80D\uDC33'	return 'INSERT_BS';
'\uD80D\uDC34'	return 'INSERT_TE';
'\uD80D\uDC35'	return 'INSERT_BE';
'\uD80D\uDC36'	return 'OVERLAY';
'\uD80D\uDC37'	return 'BEGIN_SEGMENT';
'\uD80D\uDC38'	return 'END_SEGMENT';
'\uD80D\uDC39'	return 'INSERT_M';
'\uD80D\uDC3A'	return 'INSERT_T';
'\uD80D\uDC3B'	return 'INSERT_B';
'\uD80D\uDC40'	return 'MIRROR';
'\uD80D\uDC41'	return 'FULL_BLANK';
'\uD80D\uDC42'	return 'HALF_BLANK';
'\uD80D\uDC43'	return 'FULL_LOST';
'\uD80D\uDC44'	return 'HALF_LOST';
'\uD80D\uDC45'	return 'TALL_LOST';
'\uD80D\uDC46'	return 'WIDE_LOST';

(({OPENING_CHAR})({DAMAGED_CHAR})?)?{BEGIN_ENCLOSURE_CHAR}	return 'ENCLOSURE_OPENING';
{END_ENCLOSURE_CHAR}(({CLOSING_CHAR})({DAMAGED_CHAR})?)?		return 'ENCLOSURE_CLOSING';
{OPENING_CHAR}|{CLOSING_CHAR}	return 'DELIMITER';
{DAMAGED_CHAR}	return 'DAMAGED';

<<EOF>>		return 'EOF';

/lex

%start fragment

%%

fragment
	: top_groups EOF
		{return new Fragment($top_groups);}
	;

top_groups
	:
		{$$ = [];}
	| group top_groups
		{$$ = [$group].concat($top_groups);}
	| singleton_group top_groups
		{$$ = [$singleton_group].concat($top_groups);}
	;

groups
	:
		{$$ = [];}
	| group groups
		{$$ = [$group].concat($groups);}
	;

group
	: vertical_group
		{$$ = $vertical_group;}
	| horizontal_group
		{$$ = $horizontal_group;}
	| basic_group
		{$$ = $basic_group;}
	| literal
		{$$ = $literal;}
	;

vertical_group
	: ver_subgroup rest_ver_group
		{$$ = new Vertical([$ver_subgroup].concat($rest_ver_group));}
	;

opt_rest_ver_group
	:
		{$$ = [];}
	| rest_ver_group
		{$$ = $rest_ver_group;}
	;

rest_ver_group
	: VER ver_subgroup opt_rest_ver_group
		{$$ = [$ver_subgroup].concat($opt_rest_ver_group);}
	;

br_vertical_group
	: BEGIN_SEGMENT ver_subgroup rest_br_ver_group
		{$$ = new Vertical([$ver_subgroup].concat($rest_br_ver_group));}
	;

opt_rest_br_ver_group
	: END_SEGMENT
		{$$ = [];}
	| rest_br_ver_group
		{$$ = $rest_br_ver_group;}
	;

rest_br_ver_group
	: VER ver_subgroup opt_rest_br_ver_group
		{$$ = [$ver_subgroup].concat($opt_rest_br_ver_group);}
	;

br_flat_vertical_group
	: BEGIN_SEGMENT literal rest_br_flat_ver_group
		{$$ = [$literal].concat($rest_br_flat_ver_group);}
	;

rest_br_flat_ver_group
	: VER literal rest_br_flat_ver_group
		{$$ = [$literal].concat($rest_br_flat_ver_group);}
	| VER literal END_SEGMENT
		{$$ = [$literal];}
	;

ver_subgroup
	: horizontal_group
		{$$ = $horizontal_group;}
	| basic_group
		{$$ = $basic_group;}
	| literal
		{$$ = $literal;}
	;

horizontal_group
	: hor_subgroup rest_hor_group
		{$$ = new Horizontal([$hor_subgroup].concat($rest_hor_group));}
	| literal rest_hor_group
		{$$ = new Horizontal([$literal].concat($rest_hor_group));}
	| bracket_open hor_subgroup opt_bracket_close opt_rest_hor_group
		{$$ = new Horizontal([$bracket_open, $hor_subgroup].concat(
				[$opt_bracket_close].filter(Boolean), $opt_rest_hor_group));}
	| bracket_open literal opt_bracket_close opt_rest_hor_group
		{$$ = new Horizontal([$bracket_open, $literal].concat(
				[$opt_bracket_close].filter(Boolean), $opt_rest_hor_group));}
	| hor_subgroup bracket_close opt_rest_hor_group
		{$$ = new Horizontal([$hor_subgroup, $bracket_close].concat($opt_rest_hor_group));}
	| literal bracket_close opt_rest_hor_group
		{$$ = new Horizontal([$literal, $bracket_close].concat($opt_rest_hor_group));}
	;

opt_rest_hor_group
	:
		{$$ = [];}
	| rest_hor_group
		{$$ = $rest_hor_group;}
	;

rest_hor_group
	: HOR hor_subgroup opt_rest_hor_group
		{$$ = [$hor_subgroup].concat($opt_rest_hor_group);}
	| HOR literal opt_rest_hor_group
		{$$ = [$literal].concat($opt_rest_hor_group);}
	| HOR bracket_open hor_subgroup opt_bracket_close opt_rest_hor_group
		{$$ = [$bracket_open, $hor_subgroup].concat(
			[$opt_bracket_close].filter(Boolean), $opt_rest_hor_group);}
	| HOR bracket_open literal opt_bracket_close opt_rest_hor_group
		{$$ = [$bracket_open, $literal].concat(
			[$opt_bracket_close].filter(Boolean), $opt_rest_hor_group);}
	| HOR hor_subgroup bracket_close opt_rest_hor_group
		{$$ = [$hor_subgroup, $bracket_close].concat($opt_rest_hor_group);}
	| HOR literal bracket_close opt_rest_hor_group
		{$$ = [$literal, $bracket_close].concat($opt_rest_hor_group);}
	;

br_horizontal_group
	: BEGIN_SEGMENT hor_subgroup rest_br_hor_group
		{$$ = new Horizontal([$hor_subgroup].concat($rest_br_hor_group));}
	| BEGIN_SEGMENT literal rest_br_hor_group
		{$$ = new Horizontal([$literal].concat($rest_br_hor_group));}
	| BEGIN_SEGMENT bracket_open hor_subgroup opt_bracket_close opt_rest_br_hor_group
		{$$ = new Horizontal([$bracket_open, $hor_subgroup].concat(
			[$opt_bracket_close].filter(Boolean), $opt_rest_br_hor_group));}
	| BEGIN_SEGMENT bracket_open literal opt_bracket_close opt_rest_br_hor_group
		{$$ = new Horizontal([$bracket_open, $literal].concat(
			[$opt_bracket_close].filter(Boolean), $opt_rest_br_hor_group));}
	| BEGIN_SEGMENT hor_subgroup bracket_close opt_rest_br_hor_group
		{$$ = new Horizontal([$hor_subgroup, $bracket_close].concat($opt_rest_br_hor_group));}
	| BEGIN_SEGMENT literal bracket_close opt_rest_br_hor_group
		{$$ = new Horizontal([$literal, $bracket_close].concat($opt_rest_br_hor_group));}
	;

opt_rest_br_hor_group
	: END_SEGMENT
		{$$ = [];}
	| rest_br_hor_group
		{$$ = $rest_br_hor_group;}
	;

rest_br_hor_group
	: HOR hor_subgroup opt_rest_br_hor_group
		{$$ = [$hor_subgroup].concat($opt_rest_br_hor_group);}
	| HOR literal opt_rest_br_hor_group
		{$$ = [$literal].concat($opt_rest_br_hor_group);}
	| HOR bracket_open hor_subgroup opt_bracket_close opt_rest_br_hor_group
		{$$ = [$bracket_open, $hor_subgroup].concat(
			[$opt_bracket_close].filter(Boolean), $opt_rest_br_hor_group);}
	| HOR bracket_open literal opt_bracket_close opt_rest_br_hor_group
		{$$ = [$bracket_open, $literal].concat(
			[$opt_bracket_close].filter(Boolean), $opt_rest_br_hor_group);}
	| HOR hor_subgroup bracket_close opt_rest_br_hor_group
		{$$ = [$hor_subgroup, $bracket_close].concat($opt_rest_br_hor_group);}
	| HOR literal bracket_close opt_rest_br_hor_group
		{$$ = [$literal, $bracket_close].concat($opt_rest_br_hor_group);}
	;

br_flat_horizontal_group
	: BEGIN_SEGMENT literal rest_br_flat_hor_group
		{$$ = [$literal].concat($rest_br_flat_hor_group);}
	;

rest_br_flat_hor_group
	: HOR literal rest_br_flat_hor_group
		{$$ = [$literal].concat($rest_br_flat_hor_group);}
	| HOR literal END_SEGMENT
		{$$ = [$literal];}
	;

hor_subgroup
	: br_vertical_group
		{$$ = $br_vertical_group;}
	| basic_group
		{$$ = $basic_group;}
	;

basic_group
	: core_group
		{$$ = $core_group;}
	| insertion_group
		{$$ = $insertion_group;}
	| placeholder
		{$$ = $placeholder;}
	| enclosure
		{$$ = $enclosure;}
	;

insertion_group
	: core_group insertion
		{$$ = new Basic($core_group, $insertion);}
	| literal insertion
		{$$ = new Basic($literal, $insertion);}
	;

br_insertion_group
	: BEGIN_SEGMENT core_group insertion END_SEGMENT
		{$$ = new Basic($core_group, $insertion);}
	| BEGIN_SEGMENT literal insertion END_SEGMENT
		{$$ = new Basic($literal, $insertion);}
	;

insertion
	: INSERT_TS in_subgroup opt_bs_insertion opt_te_insertion opt_be_insertion
		opt_m_insertion opt_t_insertion opt_b_insertion
		{$$ = { ts: $in_subgroup, bs: $opt_bs_insertion, te: $opt_te_insertion, be: $opt_be_insertion,
			m: $opt_m_insertion, t: $opt_t_insertion, b: $opt_b_insertion };}
	| INSERT_BS in_subgroup opt_te_insertion opt_be_insertion
		opt_m_insertion opt_t_insertion opt_b_insertion
		{$$ = { bs: $in_subgroup, te: $opt_te_insertion, be: $opt_be_insertion,
			m: $opt_m_insertion, t: $opt_t_insertion, b: $opt_b_insertion };}
	| INSERT_TE in_subgroup opt_be_insertion
		opt_m_insertion opt_t_insertion opt_b_insertion
		{$$ = { te: $in_subgroup, be: $opt_be_insertion,
			m: $opt_m_insertion, t: $opt_t_insertion, b: $opt_b_insertion };}
	| INSERT_BE in_subgroup opt_m_insertion opt_t_insertion opt_b_insertion
		{$$ = { be: $in_subgroup, m: $opt_m_insertion, t: $opt_t_insertion, b: $opt_b_insertion };}
	| INSERT_M in_subgroup opt_t_insertion opt_b_insertion
		{$$ = { m: $in_subgroup, t: $opt_t_insertion, b: $opt_b_insertion };}
	| INSERT_T in_subgroup opt_b_insertion
		{$$ = { t: $in_subgroup, b: $opt_b_insertion };}
	| INSERT_B in_subgroup
		{$$ = { b: $in_subgroup };}
	;

opt_bs_insertion
	:
		{$$ = null;}
	| INSERT_BS in_subgroup
		{$$ = $in_subgroup;}
	;

opt_te_insertion
	:
		{$$ = null;}
	| INSERT_TE in_subgroup
		{$$ = $in_subgroup;}
	;

opt_be_insertion
	:
		{$$ = null;}
	| INSERT_BE in_subgroup
		{$$ = $in_subgroup;}
	;

opt_m_insertion
	:
		{$$ = null;}
	| INSERT_M in_subgroup
		{$$ = $in_subgroup;}
	;

opt_t_insertion
	:
		{$$ = null;}
	| INSERT_T in_subgroup
		{$$ = $in_subgroup;}
	;

opt_b_insertion
	:
		{$$ = null;}
	| INSERT_B in_subgroup
		{$$ = $in_subgroup;}
	;

in_subgroup
	: br_vertical_group
		{$$ = $br_vertical_group;}
	| br_horizontal_group
		{$$ = $br_horizontal_group;}
	| br_insertion_group
		{$$ = $br_insertion_group;}
	| core_group
		{$$ = $core_group;}
	| literal
		{$$ = $literal;}
	| placeholder
		{$$ = $placeholder;}
	| enclosure
		{$$ = $enclosure;}
	;

core_group
	: flat_horizontal_group OVERLAY flat_vertical_group
		{$$ = new Overlay($flat_horizontal_group, $flat_vertical_group);}
	;

flat_horizontal_group
	: br_flat_horizontal_group
		{$$ = $br_flat_horizontal_group;}
	| literal
		{$$ = [$literal];}
	;

flat_vertical_group
	: br_flat_vertical_group
		{$$ = $br_flat_vertical_group;}
	| literal
		{$$ = [$literal];}
	;

bracket_open
	: BRACKET_OPEN
		{$$ = new BracketOpen(yytext);}
	;

bracket_close
	: BRACKET_CLOSE
		{$$ = new BracketClose(yytext);}
	;

opt_bracket_close
	:
		{$$ = null;}
	| BRACKET_CLOSE
		{$$ = new BracketClose(yytext);}
	;

literal
	: sign opt_vs opt_mirror opt_damaged
		{$$ = new Literal($sign, $opt_vs, $opt_mirror, $opt_damaged);}
	;

sign
	: SIGN
		{$$ = yytext;}
	;

opt_vs
	:
		{$$ = 0;}
	| VS
		{$$ = HieroParse.variationToNum(yytext);}
	;

opt_mirror
	:
		{$$ = false;}
	| MIRROR
		{$$ = true;}
	;

placeholder
	: FULL_BLANK
		{$$ = new Blank(1);}
	| HALF_BLANK
		{$$ = new Blank(0.5);}
	| FULL_LOST opt_vs
		{$$ = new Lost(1, 1, $opt_vs);}
	| HALF_LOST opt_vs
		{$$ = new Lost(0.5, 0.5, $opt_vs);}
	| TALL_LOST opt_vs
		{$$ = new Lost(0.5, 1, $opt_vs);}
	| WIDE_LOST opt_vs
		{$$ = new Lost(1, 0.5, $opt_vs);}
	;

enclosure
	: opening groups closing
		{$$ = new Enclosure($opening.type == HieroParse.walledOpen ? 'walled' : 'plain', $groups,
			$opening.delimiter, $opening.damage, $closing.delimiter, $closing.damage);}
	;

opening
	: ENCLOSURE_OPENING
		{$$ = HieroParse.parseOpening(yytext);}
	;

closing
	: ENCLOSURE_CLOSING
		{$$ = HieroParse.parseClosing(yytext);}
	;

singleton_group
	: delimiter opt_damaged
		{$$ = new Singleton($delimiter, $opt_damaged);}
	;

delimiter
	: DELIMITER
		{$$ = yytext;}
	;

opt_damaged
	:
		{$$ = 0;}
	| DAMAGED
		{$$ = HieroParse.damageToNum(yytext);}
	;

%%

class HieroParse {
	static damageToNum(s) {
		return s.codePointAt(0) - HieroParse.damageBase;
	}

	static variationToNum(s) {
		return s.codePointAt(0) - HieroParse.variationBase;
	}

	static parseOpening(s) {
		const chars = Array.from(s);
		if (chars.length == 1) {
			return { delimiter: null, damage: 0, type: chars[0] };
		} else if (chars.length == 2) {
			return { delimiter: chars[0], damage: 0, type: chars[1] };
		} else {
			return { delimiter: chars[0], damage: HieroParse.damageToNum(chars[1]), type: chars[2] };
		}
	}

	static parseClosing(s) {
		const chars = Array.from(s);
		if (chars.length == 1) {
			return { type: chars[0], delimiter: null, damage: 0 };
		} else if (chars.length == 2) {
			return { type: chars[0], delimiter: chars[1], damage: 0 };
		} else {
			return { type: chars[0], delimiter: chars[1], damage: HieroParse.damageToNum(chars[2]) };
		}
	}
}
HieroParse.walledOpen = '\u{1343E}';
HieroParse.variationBase = 0xFDFF;
HieroParse.damageBase = 0x13446;
