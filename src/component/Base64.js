define('ywj/Base64', function(){
	var KEY_STR = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var utf8_decode = function(e){
		var t = "";
		var n = 0;
		var r = 0,
			c1 = 0,
			c2 = 0;
		while(n < e.length){
			r = e.charCodeAt(n);
			if(r < 128){
				t += String.fromCharCode(r);
				n++
			}else if(r > 191 && r < 224){
				c2 = e.charCodeAt(n + 1);
				t += String.fromCharCode((r & 31) << 6 | c2 & 63);
				n += 2
			}else{
				c2 = e.charCodeAt(n + 1);
				c3 = e.charCodeAt(n + 2);
				t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
				n += 3
			}
		}
		return t
	};

	var utf8_encode = function(e){
		e = e.replace(/\r\n/g, "n");
		var t = "";
		for(var n = 0; n < e.length; n++){
			var r = e.charCodeAt(n);
			if(r < 128){
				t += String.fromCharCode(r)
			}else if(r > 127 && r < 2048){
				t += String.fromCharCode(r >> 6 | 192);
				t += String.fromCharCode(r & 63 | 128)
			}else{
				t += String.fromCharCode(r >> 12 | 224);
				t += String.fromCharCode(r >> 6 & 63 | 128);
				t += String.fromCharCode(r & 63 | 128)
			}
		}
		return t;
	};

	var Base64 = {
		urlSafeEncode: function(text){
			return Base64.encode(text)
				.replace('+', '-')
				.replace('/', '_');
		},

		encode: function(text){
			var t = "";
			var n, r, i, s, o, u, a;
			var f = 0;
			text = utf8_encode(text);
			while(f < text.length){
				n = text.charCodeAt(f++);
				r = text.charCodeAt(f++);
				i = text.charCodeAt(f++);
				s = n >> 2;
				o = (n & 3) << 4 | r >> 4;
				u = (r & 15) << 2 | i >> 6;
				a = i & 63;
				if(isNaN(r)){
					u = a = 64
				}else if(isNaN(i)){
					a = 64
				}
				t = t + KEY_STR.charAt(s) + KEY_STR.charAt(o) + KEY_STR.charAt(u) + KEY_STR.charAt(a)
			}
			return t
		},
		decode: function(text){
			var t = "";
			var n, r, i;
			var s, o, u, a;
			var f = 0;
			text = text.replace(/\+\+[++^A-Za-z0-9+/=]/g, "");
			while(f < text.length){
				s = KEY_STR.indexOf(text.charAt(f++));
				o = KEY_STR.indexOf(text.charAt(f++));
				u = KEY_STR.indexOf(text.charAt(f++));
				a = KEY_STR.indexOf(text.charAt(f++));
				n = s << 2 | o >> 4;
				r = (o & 15) << 4 | u >> 2;
				i = (u & 3) << 6 | a;
				t = t + String.fromCharCode(n);
				if(u != 64){
					t = t + String.fromCharCode(r)
				}
				if(a != 64){
					t = t + String.fromCharCode(i)
				}
			}
			t = utf8_decode(t);
			return t
		},
	};
	return Base64;
});