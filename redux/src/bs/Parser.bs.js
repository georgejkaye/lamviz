// Generated by ReScript, PLEASE EDIT WITH CARE

import * as Char from "../../node_modules/bs-platform/lib/es6/char.js";
import * as List from "../../node_modules/bs-platform/lib/es6/list.js";
import * as Helpers from "./Helpers.bs.js";
import * as Caml_obj from "../../node_modules/bs-platform/lib/es6/caml_obj.js";
import * as Pervasives from "../../node_modules/bs-platform/lib/es6/pervasives.js";
import * as Caml_string from "../../node_modules/bs-platform/lib/es6/caml_string.js";
import * as Caml_exceptions from "../../node_modules/bs-platform/lib/es6/caml_exceptions.js";

var ParseError = Caml_exceptions.create("Parser.ParseError");

function token_type(token) {
  if (typeof token !== "number") {
    return 5;
  }
  switch (token) {
    case /* EOF */0 :
        return 0;
    case /* LAMBDA */1 :
        return 1;
    case /* LBRACKET */2 :
        return 2;
    case /* RBRACKET */3 :
        return 3;
    case /* DOT */4 :
        return 4;
    case /* GARBAGE */5 :
        return 6;
    
  }
}

function index$prime(a, _xs, _n) {
  while(true) {
    var n = _n;
    var xs = _xs;
    if (xs) {
      if (Caml_obj.caml_equal(xs.hd, a)) {
        return n;
      }
      _n = n + 1 | 0;
      _xs = xs.tl;
      continue ;
    }
    throw {
          RE_EXN_ID: ParseError,
          _1: "Variable not in context.",
          Error: new Error()
        };
  };
}

function index(a, xs) {
  return index$prime(a, xs, 0);
}

function token_cmp(token1, token2) {
  return token_type(token1) === token_type(token2);
}

function next_char(s, i) {
  if (i < s.length) {
    return Caml_string.get(s, i);
  }
  
}

var letters = /[a-z]/;

function lexer$prime(term, _i, _seen) {
  while(true) {
    var seen = _seen;
    var i = _i;
    var x = next_char(term, i);
    if (x === undefined) {
      if (seen !== "") {
        return {
                hd: /* ID */{
                  _0: seen
                },
                tl: {
                  hd: /* EOF */0,
                  tl: /* [] */0
                }
              };
      } else {
        return {
                hd: /* EOF */0,
                tl: /* [] */0
              };
      }
    }
    if (letters.test(Char.escaped(x))) {
      _seen = seen + Char.escaped(x);
      _i = i + 1 | 0;
      continue ;
    }
    if (seen !== "") {
      return {
              hd: /* ID */{
                _0: seen
              },
              tl: lexer$prime(term, i, "")
            };
    }
    var t;
    if (x >= 47) {
      t = x !== 92 ? /* GARBAGE */5 : /* LAMBDA */1;
    } else if (x >= 40) {
      switch (x - 40 | 0) {
        case 0 :
            t = /* LBRACKET */2;
            break;
        case 1 :
            t = /* RBRACKET */3;
            break;
        case 2 :
        case 3 :
        case 4 :
        case 5 :
            t = /* GARBAGE */5;
            break;
        case 6 :
            t = /* DOT */4;
            break;
        
      }
    } else {
      t = /* GARBAGE */5;
    }
    if (t !== /* GARBAGE */5) {
      return {
              hd: t,
              tl: lexer$prime(term, i + 1 | 0, "")
            };
    }
    _seen = "";
    _i = i + 1 | 0;
    continue ;
  };
}

function lexer(term) {
  return lexer$prime(term, 0, "");
}

function next(token, tokens) {
  if (tokens) {
    return token_cmp(tokens.hd, token);
  } else {
    return false;
  }
}

function value(token) {
  if (typeof token === "number") {
    return Pervasives.failwith("token has no value");
  } else {
    return token._0;
  }
}

function token(token$1, tokens) {
  if (next(token$1, tokens)) {
    return [
            List.hd(tokens),
            List.tl(tokens)
          ];
  } else {
    return [
            /* GARBAGE */5,
            tokens
          ];
  }
}

function match(token, tokens) {
  if (next(token, tokens)) {
    return List.tl(tokens);
  }
  throw {
        RE_EXN_ID: ParseError,
        _1: "Unexpected token encountered.",
        Error: new Error()
      };
}

function skip(token, tokens) {
  if (next(token, tokens)) {
    return [
            true,
            List.tl(tokens)
          ];
  } else {
    return [
            false,
            tokens
          ];
  }
}

function term(ctx, tokens) {
  var match$1 = skip(/* LAMBDA */1, tokens);
  var tokens$1 = match$1[1];
  if (!match$1[0]) {
    return application(ctx, tokens$1);
  }
  var match$2 = token(/* ID */{
        _0: ""
      }, tokens$1);
  var id = match$2[0];
  var tokens$2 = match(/* DOT */4, match$2[1]);
  var match$3 = term({
        hd: value(id),
        tl: ctx
      }, tokens$2);
  return [
          {
            TAG: /* Abs */1,
            _0: match$3[0],
            _1: value(id),
            _2: ""
          },
          match$3[1]
        ];
}

function application(ctx, tokens) {
  var match = atom(ctx, tokens);
  var lhs = match[0];
  var lhs$1;
  if (lhs !== undefined) {
    lhs$1 = lhs;
  } else {
    throw {
          RE_EXN_ID: ParseError,
          _1: "Unexpected character encountered.",
          Error: new Error()
        };
  }
  return application$prime(lhs$1, ctx, match[1]);
}

function application$prime(_lhs, ctx, _tokens) {
  while(true) {
    var tokens = _tokens;
    var lhs = _lhs;
    var match = atom(ctx, tokens);
    var tokens$1 = match[1];
    var rhs = match[0];
    if (rhs === undefined) {
      return [
              lhs,
              tokens$1
            ];
    }
    var lhs$1 = {
      TAG: /* App */2,
      _0: lhs,
      _1: rhs,
      _2: ""
    };
    _tokens = tokens$1;
    _lhs = lhs$1;
    continue ;
  };
}

function atom(ctx, tokens) {
  var match$1 = skip(/* LBRACKET */2, tokens);
  var tokens$1 = match$1[1];
  var b2 = next(/* ID */{
        _0: ""
      }, tokens$1);
  if (match$1[0]) {
    var match$2 = term(ctx, tokens$1);
    var tokens$2 = match(/* RBRACKET */3, match$2[1]);
    return [
            match$2[0],
            tokens$2
          ];
  }
  if (!b2) {
    return [
            undefined,
            tokens$1
          ];
  }
  var match$3 = token(/* ID */{
        _0: ""
      }, tokens$1);
  return [
          {
            TAG: /* Var */0,
            _0: index$prime(value(match$3[0]), ctx, 0),
            _1: ""
          },
          match$3[1]
        ];
}

function parse(context, tokens) {
  var match$1 = term(context, tokens);
  match(/* EOF */0, match$1[1]);
  return match$1[0];
}

function lex_and_parse(term, context) {
  var lexed = lexer$prime(term, 0, "");
  var context$1 = Helpers.split(context, /* " " */32);
  var parsed = parse(context$1, lexed);
  return [
          parsed,
          context$1
        ];
}

export {
  ParseError ,
  token_type ,
  index$prime ,
  index ,
  token_cmp ,
  next_char ,
  letters ,
  lexer$prime ,
  lexer ,
  next ,
  value ,
  token ,
  match ,
  skip ,
  term ,
  application ,
  application$prime ,
  atom ,
  parse ,
  lex_and_parse ,
  
}
/* No side effect */
