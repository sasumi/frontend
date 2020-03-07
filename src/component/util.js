/**
 * Created by sasumi on 2014/12/2.
 */
define('ywj/util', function(require){
	var $ = require('jquery');
	var lang = require('lang/$G_LANGUAGE');

	/**
	 * check item is in array
	 * @param item
	 * @param {Array} arr
	 * @return {boolean}
	 */
	var inArray = function(item, arr){
		for(var i = arr.length - 1; i >= 0; i--){
			if(arr[i] == item){
				return true;
			}
		}
		return false;
	};

	/**
	 * 字符切割
	 * @param string 字符串
	 * @param {string} delimiters 分隔符（支持多个）
	 * @param {boolean} clear_empty 是否清除掉空白字符串（默认清除）
	 * @return {Array}
	 */
	var explode = function(string, delimiters, clear_empty){
		if(!string){
			return [];
		}
		clear_empty = clear_empty === undefined ? true : !!clear_empty;
		var result = [];
		var de1 = delimiters[0];
		if(delimiters.length > 1){
			for(var i=1; i<delimiters.length; i++){
				string = string.replace(new RegExp(pregQuote(delimiters[i]), 'g'), de1);
			}
		}
		var item = string.split(de1);
		for(var i in item){
			if(clear_empty){
				var val = $.trim(item[i]);
				if(val.length){
					result.push(val);
				}
			} else {
				result.push(item[i]);
			}
		}
		return result;
	};

	var htmlEscape = function(str){
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	};

	var htmlEscapeObject = function(obj){
		if(isString(obj)){
			return htmlEscape(obj);
		} else if(isScalar(obj)){
			return obj;
		} else {
			for(var i in obj){
				obj[i] = htmlEscapeObject(obj[i]);
			}
			return obj;
		}
	};

	var selectorEscape = function(str){
		return (window.CSS && CSS.escape) ? CSS.escape(str) : str.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&");
	};

	var htmlUnescape = function(str){
		return String(str)
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&amp;/g, '&');
	};

	var pregQuote = function(str){
		return (str + '').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
	};

	/**
	 * check an object is an empty
	 * @param  obj
	 * @return {Boolean}
	 */
	var isEmptyObject = function(obj){
		if(typeof(obj) == 'object'){
			for(var i in obj){
				if(i !== undefined){
					return false;
				}
			}
		}
		return true;
	};

	/**
	 * open link without referer
	 * @param link
	 * @returns {boolean}
	 */
	var openLinkWithoutReferer = function(link){
		var instance = window.open("about:blank");
		instance.document.write("<meta http-equiv=\"refresh\" content=\"0;url="+link+"\">");
		instance.document.close();
		return false;
	};

	/**
	 * check object is plain object
	 * @param  obj
	 * @return {Boolean}
	 */
	var isPlainObject = function(obj){
		return obj && toString.call(obj) === "[object Object]" && !obj["nodeType"] && !obj["setInterval"];
	};

	var isScalar = function(value){
		var type = getType(value);
		return type === 'number' || type === 'boolean' || type === 'string' || type === 'null' || type === 'undefined';
	};

	/**
	 * check number is integer
	 * @param value
	 * @returns {boolean}
	 */
	var isInt = function(value){
		return !isNaN(value) &&
			parseInt(Number(value)) === value && !isNaN(parseInt(value, 10));
	};

	/**
	 * 判断一个对象是否为一个DOM 或者 BOM
	 * @param value
	 * @return {Boolean}
	 **/
	var isBomOrDom = function(value){
		if(this.isScalar(value)){
			return false;
		}
		if($.browser.ie){
			//Node, Event, Window
			return value['nodeType'] || value['srcElement'] || (value['top'] && value['top'] == Y.W.top);
		}else{
			return getType(value) !== 'object' && getType(value) !== 'function';
		}
	};

	/**
	 * check object is boolean
	 * @param  obj
	 * @return {Boolean}
	 */
	var isBoolean = function(obj){
		return getType(obj) === 'boolean';
	};

	/**
	 * check object is a string
	 * @param  obj
	 * @return {Boolean}
	 */
	var isString = function(obj){
		return getType(obj) === 'string';
	};

	/**
	 * check object is an array
	 * @param  obj
	 * @return {Boolean}
	 */
	var isArray = function(obj){
		return getType(obj) === 'array';
	};

	/**
	 * array_column
	 * @param arr
	 * @param col_name
	 * @returns {Array}
	 */
	var arrayColumn = function(arr, col_name){
		var data = [];
		for(var i in arr){
			data.push(arr[i][col_name]);
		}
		return data;
	};

	var arrayIndex = function(arr, val){
		for(var i in arr){
			if(arr[i] == val){
				return i;
			}
		}
		return null;
	};

	/**
	 * array group
	 * @param arr
	 * @param by_key
	 * @param limit limit one child
	 * @returns {*}
	 */
	var arrayGroup = function(arr, by_key, limit) {
		if(!arr || !arr.length) {
			return arr;
		}
		var tmp_rst = {};
		$.each(arr, function(_, item){
			var k = item[by_key];
			if(!tmp_rst[k]){
				tmp_rst[k] = [];
			}
			tmp_rst[k].push(item);
		});
		if(!limit){
			return tmp_rst;
		}
		var rst = [];
		for(var i in tmp_rst){
			rst[i] = tmp_rst[i][0];
		}
		return rst;
	};

	/**
	 * 修正checkbox required行为属性
	 * @param scope
	 */
	var fix_checkbox_required = function(scope){
		var $scope = $(scope || 'body');
		var FLAG = 'fix-checkbox-required-bind';
		$(':checkbox[required]',$scope).each(function(){
			var $chk = $(this);
			if(!$chk.data(FLAG)){
				$chk.data(FLAG, 1);
				$chk.change(function(){
					var $all_chks = $scope.find(':checkbox[name='+selectorEscape($chk.attr('name'))+']');
					if($all_chks.is(':checked')){
						$all_chks.removeAttr('required');
					} else {
						$all_chks.attr('required', 'required');
					}
				}).triggerHandler('change');
			}
		});
	};

	/**
	 * 修正浏览器 datalist触发时，未能显示全部option list
	 * @todo 在触发时，会出现不能用删除（退格）键删除原来的数值
	 * @param $inputs
	 */
	var fix_datalist_option = function($inputs){
		var DATA_KEY = 'data-initialize-value';
		$inputs.each(function(){
			var $inp = $(this);
			var already_has_placeholder = $inp.attr('placeholder');
			$inp.mousedown(function(){
				if(!already_has_placeholder){
					$inp.attr('placeholder', this.value);
				}
				if(this.value){
					$inp.data(DATA_KEY, this.value);
					$inp.val('');
				}
			}).on('blur', function(){
				if($inp.val() === '' && $inp.data(DATA_KEY) !== null){
					$inp.val($inp.data(DATA_KEY));
				}
				if(!already_has_placeholder){
					$inp.attr('placeholder', '');
				}
			})
		});
	};

	/**
	 * check object is a function
	 * @param  obj
	 * @return {Boolean}
	 */
	var isFunction = function(obj){
		return getType(obj) === 'function';
	};

	/**
	 * get type
	 * @param obj
	 * @return {string}
	 */
	var getType = function(obj){
		if(isElement(obj)){
			return 'element';
		}
		return obj === null ? 'null' : (obj === undefined ? 'undefined' : Object.prototype.toString.call(obj).slice(8, -1).toLowerCase());
	};

	/**
	 * isElement
	 * @param obj
	 * @returns {boolean}
	 */
	var isElement = function(obj){
		try{
			//Using W3 DOM2 (works for FF, Opera and Chrome)
			return obj instanceof HTMLElement;
		}
		catch(e){
			//Browsers not supporting W3 DOM2 don't have HTMLElement and
			//an exception is thrown and we end up here. Testing some
			//properties that all elements have. (works on IE7)
			return (typeof obj === "object") &&
				(obj.nodeType === 1) && (typeof obj.style === "object") &&
				(typeof obj.ownerDocument === "object");
		}
	};

	/**
	 * get parent node by selector condition
	 * @param node
	 * @param con
	 * @returns {*}
	 */
	var findParent = function(node, con){
		var ps = $(node).parentsUntil(con);
		var tp = $(ps[ps.size() - 1]);
		return tp.parent();
	};

	/**
	 * trans collection to array
	 * @param {Object} col dom collection
	 */
	var toArray = function(col){
		if(col.item){
			var l = col.length, arr = new Array(l);
			while(l--) arr[l] = col[l];
			return arr;
		}else{
			var arr = [];
			for(var i = 0; i < col.length; i++){
				arr[i] = col[i];
			}
			return arr;
		}
	};

	/**
	 * clone object without case-sensitive checking
	 * @param target_data
	 * @param source_data
	 */
	var cloneConfigCaseInsensitive = function(source_data, target_data){
		if(isElement(target_data)){
			console.warn('element clone operation');
			return target_data;
		}
		if(getType(source_data) != 'object' || getType(target_data) != 'object'){
			return target_data;
		}

		var tmp = source_data;
		for(var tk in target_data){
			var found = false;
			for(var sk in source_data){
				if(getType(tk) == 'string' && getType(sk) == 'string' && sk.toLowerCase() == tk.toLowerCase()){
					tmp[sk] = cloneConfigCaseInsensitive(source_data[sk], target_data[tk]);
					found = true;
				}
			}
			if(!found){
				tmp[tk] = target_data[tk];
			}
		}
		return tmp;
	};

	/**
	 * 检测多个容器是包含target
	 * @param $target
	 * @param $ctn1
	 * @returns {boolean}
	 */
	var contains = function($target, $ctn1){
		var containers = toArray(arguments);
		containers.shift();
		var hit = false;
		$.each(containers, function(k, $ctn){
			if($ctn[0] === $target[0] || $.contains($ctn[0], $target[0])){
				hit = true;
				return false;
			}
		});
		return hit;
	};

	/**
	 * access object property by statement
	 * @param statement
	 * @param obj
	 * @returns {*}
	 */
	var accessObject = function(statement, obj){
		obj = obj || {};
		var tmp;
		try{
			eval('tmp = obj.' + statement);
		}catch(ex){
		}
		return tmp;
	};

	var tryFrame = function(){
		var frame = window.frameElement;
		if(!frame){
			var try_domains = function(domain){
				console.log('Trying domain:',domain);
				try {
					window.document.domain = domain;
					if(!window.frameElement){
						throw("window frameElement access deny.");
					}
					return window.frameElement;
				} catch (ex){
					console.warn(ex);
					var tmp = domain.split('.');
					if(tmp.length > 1){
						return try_domains(tmp.slice(1).join('.'));
					}
					throw("window frameElement try fail:"+tmp.join('.'));
				}
			};
			frame = try_domains(location.host);
		}
		return frame;
	};

	/**
	 * 获取窗口的相关测量信息
	 * @returns {{}}
	 */
	var getRegion = function(win){
		var info = {};
		win = win || window;
		var doc = win.document;
		info.screenLeft = win.screenLeft ? win.screenLeft : win.screenX;
		info.screenTop = win.screenTop ? win.screenTop : win.screenY;

		//no ie
		if(win.innerWidth){
			info.visibleWidth = win.innerWidth;
			info.visibleHeight = win.innerHeight;
			info.horizenScroll = win.pageXOffset;
			info.verticalScroll = win.pageYOffset;
		}else{
			//IE + DOCTYPE defined || IE4, IE5, IE6+no DOCTYPE
			var tmp = (doc.documentElement && doc.documentElement.clientWidth) ?
				doc.documentElement : doc.body;
			info.visibleWidth = tmp.clientWidth;
			info.visibleHeight = tmp.clientHeight;
			info.horizenScroll = tmp.scrollLeft;
			info.verticalScroll = tmp.scrollTop;
		}

		var tag = (doc.documentElement && doc.documentElement.scrollWidth) ?
			doc.documentElement : doc.body;
		info.documentWidth = Math.max(tag.scrollWidth, info.visibleWidth);
		info.documentHeight = Math.max(tag.scrollHeight, info.visibleHeight);
		return info;
	};

	/**
	 * 获取当前窗口节点在顶部窗口位置
	 * @param $node
	 * @returns {{left: number, top: number}}
	 */
	var getNodeRegionInTop = function($node){
		var win = window;
		var rect = {left:0, top:0};
		var body = document.body;
		try {
			var r = $node[0].getBoundingClientRect();
			rect.left += r.left + ($(body).scrollLeft() || $(body.parentNode).scrollLeft());
			rect.top += r.top + ($(body).scrollTop() || $(body.parentNode).scrollTop());

			while(win.frameElement){
				var fr = window.frameElement.getBoundingClientRect();
				rect.left += fr.left;
				rect.top += fr.top;
				win = win.parent;
				var sl = $(win.document.body).scrollLeft() || $(win.document.body.parentNode).scrollLeft();
				var st = $(win.document.body).scrollTop() || $(win.document.body.parentNode).scrollTop();

				rect.left += sl;
				rect.top += st;
			}
		} catch(ex){
			console.error(ex);
		}
		return rect;
	};

	var scrollTo = function($el, $container, margin){
		margin = margin || {left:0, top:0}; //偏移量
		$container.animate({
			scrollTop: $container.scrollTop() + $el.offset().top - $container.offset().top - margin.top,
			scrollLeft: $container.scrollLeft() + $el.offset().left - $container.offset().left - margin.left
		}, {
			duration: 'fast',
			easing: 'swing'
		});
	};

	/**
	 * 中英文字符串截取（中文按照2个字符长度计算）
	 * @param str
	 * @param len
	 * @param eclipse_text
	 * @returns {*}
	 */
	var cutString = function(str, len, eclipse_text){
		if(eclipse_text === undefined){
			eclipse_text = '...';
		}
		var r = /[^\x00-\xff]/g;
		if(str.replace(r, "mm").length <= len){
			return str;
		}
		var m = Math.floor(len / 2);
		for(var i = m; i < str.length; i++){
			if(str.substr(0, i).replace(r, "mm").length >= len){
				return str.substr(0, i) + eclipse_text;
			}
		}
		return str;
	};

	var copy = function(text, compatible){
		var $t = $('<textarea readonly="readonly">').appendTo('body');
		$t[0].style.cssText = 'position:absolute; left:-9999px;';
		var y = window.pageYOffset || document.documentElement.scrollTop;
		$t.focus(function(){
			window.scrollTo(0, y);
		});
		$t.val(text).select();
		var succeeded = false;
		try{
			succeeded = document.execCommand('copy');
		}catch(err){
			console.error(err);
		}
		$t.remove();
		if(!succeeded && compatible){
			window.prompt(lang('请按键: Ctrl+C, Enter复制内容'), text);
			return true;
		}
		console.info('copy ' + (succeeded ? 'succeeded' : 'fail'), text);
		return succeeded;
	};

	function copyFormatted(html){
		// Create container for the HTML
		// [1]
		var container = document.createElement('div');
		container.innerHTML = html;

		// Hide element
		// [2]
		container.style.position = 'fixed';
		container.style.pointerEvents = 'none';
		container.style.opacity = 0;

		// Detect all style sheets of the page
		var activeSheets = Array.prototype.slice.call(document.styleSheets)
			.filter(function(sheet){
				return !sheet.disabled
			});

		// Mount the iframe to the DOM to make `contentWindow` available
		// [3]
		document.body.appendChild(container);

		// Copy to clipboard
		// [4]
		window.getSelection().removeAllRanges();

		var range = document.createRange();
		range.selectNode(container);
		window.getSelection().addRange(range);

		// [5.1]
		document.execCommand('copy');

		// [5.2]
		for(var i = 0; i < activeSheets.length; i++) activeSheets[i].disabled = true

		// [5.3]
		document.execCommand('copy');

		// [5.4]
		for(var i = 0; i < activeSheets.length; i++) activeSheets[i].disabled = false

		// Remove the iframe
		// [6]
		document.body.removeChild(container)
	}

	var round = function(num, digits){
		digits = digits === undefined ? 2 : digits;
		var multiple = Math.pow(10, digits);
		return Math.round(num * multiple) / multiple;
	};

	/**
	 * 获取指定容器下的表单元素的值
	 * @param formContainer
	 * @return string query string
	 */
	var getFormData = function(formContainer){
		var data = [];
		$(':input', formContainer).each(function(){
			if(!this.name || this.value === undefined){
				return;
			}
			if((this.type == 'radio' || this.type == 'checkbox')){
				if(this.checked){
					data.push(encodeURIComponent(this.name) + '=' + encodeURIComponent(this.value));
				}
			}else{
				data.push(encodeURIComponent(this.name) + '=' + encodeURIComponent(this.value));
			}
		});
		return data.join('&');
	};

	/**
	 * 获取u8字符串长度(一个中文字按照3个字数计算)
	 * @param str
	 * @returns {number}
	 */
	var getU8StrLen = function(str){
		var realLength = 0;
		var len = str.length;
		var charCode = -1;
		for(var i = 0; i < len; i++){
			charCode = str.charCodeAt(i);
			if(charCode >= 0 && charCode <= 128){
				realLength += 1;
			}else{
				realLength += 3;
			}
		}
		return realLength;
	};

	/**
	 * @hack
	 */
	var preventClickDelegate = function(){
		var $m = $('<div style="position:absolute; width:100%; height:100%; z-index:65500; top:0; left:0"></div>').appendTo($('body'));
		$m.mouseup(function(){
			setTimeout(function(){
				$m.remove();
			}, 0);
		});
		setTimeout(function(){
			$m.remove();
		}, 5000);
	};

	var between = function(val, min, max){
		return val >= min && val <= max;
	};

	/**
	 * 检测矩形是否在指定布局内部
	 * @param rect
	 * @param layout
	 * @returns {*}
	 */
	var rectInLayout = function(rect, layout){
		return between(rect.top, layout.top, layout.top + layout.height) && between(rect.left, layout.left, layout.left + layout.width) //左上角
			&& between(rect.top+rect.height, layout.top, layout.top + layout.height) && between(rect.left+rect.width, layout.left, layout.left + layout.width); //右下角
	};

	/**
	 * 矩形置中
	 * @param rect
	 * @param layout
	 * @returns {{left: number, top: number}}
	 */
	var rectCenter = function(rect, layout){
		layout.top = layout.top || 0;
		layout.left = layout.left || 0;
		return {
			left: layout.left + layout.width / 2 - rect.width / 2,
			top: layout.top + layout.height / 2 - rect.height / 2
		}
	};

	/**
	 * 矩形相交（包括边重叠情况）
	 * @param rect1
	 * @param rect2
	 * @returns {boolean}
	 */
	var rectAssoc = function(rect1, rect2){
		if(rect1.left <= rect2.left){
			return (rect1.left + rect1.width) >= rect2.left && (
				between(rect2.top, rect1.top, rect1.top+rect1.height) ||
				between(rect2.top+rect2.height, rect1.top, rect1.top+rect1.height) ||
				rect2.top >= rect1.top && rect2.height >= rect1.height
			);
		} else {
			return (rect2.left + rect2.width) >= rect1.left && (
				between(rect1.top, rect2.top, rect2.top+rect2.height) ||
				between(rect1.top+rect1.height, rect2.top, rect2.top+rect2.height) ||
				rect1.top >= rect2.top && rect1.height >= rect2.height
			);
		}
	};

	/**
	 * 节点不可选择
	 * @param node
	 */
	var setNodeSelectDisabled = function(node){
		if($.browser.mozilla){//Firefox
			$(node).css('MozUserSelect', 'none');
		}else if($.browser.msie){//IE
			$(node).bind('selectstart', function(){
				return false;
			});
		}else{//Opera, etc.
			$(node).mousedown(function(){
				return false;
			});
		}
	};

	var resetNode = function($node){
		var html = $node[0].outerHTML;
		if($node.prev().size()){
			var $prev = $node.prev();
			$node.remove();
			$(html).insertAfter($prev);
		} else if($node.next().size()){
			var $next = $node.next();
			$node.remove();
			$(html).insertBefore($next);
		} else {
			var $parent = $($node[0].parentNode);
			$node.remove();
			$parent.html(html);
		}
	};

	/**
	 * 移动终端侦测
	 * @type {boolean}
	 */
	var isMobile = false;
	if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
		|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))){
		isMobile = true;
	}

	var resolve_ext = function(src){
		var f = /\/([^/]+)$/ig.exec(src);
		if(f){
			var t = /(\.[\w]+)/.exec(f[1]);
			return t ? t[1] : '';
		}
		return null;
	};

	var resolve_file_name = function(src){
		var f = /\/([^/]+)$/ig.exec(src);
		if(f){
			var t = /([\w]+)/.exec(f[1]);
			if(t){
				return t[1];
			}
		}
		return null;
	};

	/**
	 * generate GUID
	 * @return string
	 */
	var __guid = 0;
	var guid = function(){
		return '_ywj_guid_' + (++__guid);
	};

	return {
		isMobile: isMobile,
		KEYS: {
			ENTER: 13,
			DOWN: 40,
			UP: 38,
			LEFT: 37,
			RIGHT: 39,
			ESC: 27,
			TAB: 9,
			BACKSPACE: 8,
			COMMA: 188,
			ESCAPE: 27,
			HOME: 36,
			PAGE_DOWN: 34,
			PAGE_UP: 33,
			PERIOD: 190
		},
		getRegion: getRegion,
		getNodeRegionInTop: getNodeRegionInTop,
		tryFrame:tryFrame,
		toArray: toArray,
		round: round,
		between: between,
		inArray: inArray,
		isArray: isArray,
		arrayColumn: arrayColumn,
		arrayIndex: arrayIndex,
		arrayGroup: arrayGroup,
		isElement: isElement,
		getType: getType,
		cloneConfigCaseInsensitive: cloneConfigCaseInsensitive,
		htmlEscape: htmlEscape,
		htmlEscapeObject: htmlEscapeObject,
		selectorEscape: selectorEscape,
		scrollTo: scrollTo,
		htmlUnescape: htmlUnescape,
		rectInLayout: rectInLayout,
		rectAssoc: rectAssoc,
		rectCenter: rectCenter,
		contains:contains,
		pregQuote: pregQuote,
		resetNode: resetNode,
		cutString: cutString,
		explode: explode,
		fixCheckboxRequired: fix_checkbox_required,
		fixDatalistOption: fix_datalist_option,
		setNodeSelectDisabled: setNodeSelectDisabled,
		isEmptyObject: isEmptyObject,
		isPlainObject: isPlainObject,
		isFunction: isFunction,
		openLinkWithoutReferer: openLinkWithoutReferer,
		isInt: isInt,
		isScalar: isScalar,
		isBomOrDom: isBomOrDom,
		isBoolean: isBoolean,
		isString: isString,
		accessObject: accessObject,
		getU8StrLen: getU8StrLen,
		guid: guid,
		copy: copy,
		copyFormatted: copyFormatted,
		resolveExt: resolve_ext,
		resolveFileName: resolve_file_name,
		findParent: findParent,
		getFormData: getFormData,
		preventClickDelegate: preventClickDelegate
	};
});