/**
 * Created by sasumi on 2014/12/2.
 */
define('ywj/util', function(require){
	var $ = require('jquery');

	/**
	 * check item is in array
	 * @param item
	 * @param  {array} arr
	 * @return {boolean}
	 */
	var inArray = function(item, arr){
		for(var i=arr.length-1; i>=0; i--){
			if(arr[i] == item){
				return true;
			}
		}
		return false;
	};

	var htmlEscape = function(str){
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	};

	var htmlUnescape = function(str){
		return String(str)
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&amp;/g, '&');
	};

	var pregQuote = function(str) {
		return (str+'').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
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
	 * check object is plain object
	 * @param  obj
	 * @return {Boolean}
	 */
	var isPlainObject = function(obj){
		return obj && toString.call(obj) === "[object Object]" && !obj["nodeType"] && !obj["setInterval"];
	};

	var isScalar = function(value){
		var type = getType(value);
		return type == 'number' || type == 'boolean' || type == 'string' || type == 'null' || type == 'undefined';
	};

	/**
	 * 判断一个对象是否为一个DOM 或者 BOM
	 * @paramvalue
	 * @return {Boolean}
	 **/
	var isBomOrDom = function(value){
		if(this.isScalar(value)){
			return false;
		}
		if($.browser.ie){
			//Node, Event, Window
			return value['nodeType'] || value['srcElement'] || (value['top'] && value['top'] == Y.W.top);
		} else {
			return getType(value) != 'object' && getType(value) != 'function';
		}
	};

	/**
	 * check object is boolean
	 * @param  obj
	 * @return {Boolean}
	 */
	var isBoolean = function(obj){
		return getType(obj) == 'boolean';
	};

	/**
	 * check object is a string
	 * @param  obj
	 * @return {Boolean}
	 */
	var isString = function(obj){
		return getType(obj) == 'string';
	};

	/**
	 * check object is an array
	 * @param  obj
	 * @return {Boolean}
	 */
	var isArray = function(obj){
		return getType(obj) == 'array';
	};

	/**
	 * check object is a function
	 * @param  obj
	 * @return {Boolean}
	 */
	var isFunction = function(obj){
		return getType(obj) == 'function';
	};

	/**
	 * get type
	 * @param obj
	 * @return {string}
	 */
	var getType = function(obj){
		return obj === null ? 'null' : (obj === undefined ? 'undefined' : Object.prototype.toString.call(obj).slice(8, -1).toLowerCase());
	};

	/**
	 * get parent node by selector condition
	 * @param node
	 * @param con
	 * @returns {*}
	 */
	var findParent = function(node, con){
		var ps = $(node).parentsUntil(con);
		var tp = $(ps[ps.size()-1]);
		return tp.parent();
	};

	/**
	 * trans collection to array
	 * @param {Object} coll, dom collection
	 */
	var toArray = function(col){
		if(col.item){
			var l = col.length, arr = new Array(l);
			while (l--) arr[l] = col[l];
			return arr;
		} else {
			var arr = [];
			for(var i=0; i<col.length; i++){
				arr[i] = col[i];
			}
			return arr;
		}
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
		try {
			eval('tmp = obj.'+statement);
		} catch(ex){}
		return tmp;
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
		} else {
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
	 * copy
	 * @param text
	 * @param compatible
	 * @returns {boolean}
	 */
	var copy = function(text, compatible){
		var selection, range, mark;
		try {
			range = document.createRange();
			selection = document.getSelection();

			mark = document.createElement('mark');
			mark.textContent = text;
			document.body.appendChild(mark);

			range.selectNode(mark);
			selection.addRange(range);

			var successful = document.execCommand('copy');
			if (!successful) {
				throw new Error('copy command was unsuccessful');
			}
		} catch (err) {
			console.error('unable to copy, trying IE specific stuff');
			try {
				window.clipboardData.setData('text', text);
			} catch (err) {
				console.error('unable to copy, falling back to prompt');
				if(compatible){
					window.prompt('请按键: Ctrl+C, Enter复制内容', text);
				}
			}
		} finally {
			if (selection) {
				if (typeof selection.removeRange == 'function') {
					selection.removeRange(range);
				} else {
					selection.removeAllRanges();
				}
			}
			if (mark) {
				document.body.removeChild(mark);
			}
		}
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
					data.push(encodeURIComponent(this.name)+'='+encodeURIComponent(this.value));
				}
			} else {
				data.push(encodeURIComponent(this.name)+'='+encodeURIComponent(this.value));
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
			if (charCode >= 0 && charCode <= 128) {
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
			},0);
		});
		setTimeout(function(){
			$m.remove();
		}, 5000);
	};

	/**
	 * 节点不可选择
	 * @param node
	 */
	var setNodeSelectDisabled = function(node){
		if($.browser.mozilla){//Firefox
			$(node).css('MozUserSelect','none');
		}else if($.browser.msie){//IE
			$(node).bind('selectstart',function(){return false;});
		}else{//Opera, etc.
			$(node).mousedown(function(){return false;});
		}
	};

	/**
	 * 移动终端侦测
	 * @type {boolean}
	 */
	var isMobile = false;
	if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
		|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))){
		isMobile = true;
	}

	/**
	 * generate GUID
	 * @return string
	 */
	var __guid = 0;
	var guid = function(){
		return '_ywj_guid_'+(++__guid);
	};

	return {
		isMobile: isMobile,
		getRegion: getRegion,
		toArray: toArray,
		inArray: inArray,
		isArray: isArray,
		getType: getType,
		htmlEscape: htmlEscape,
		htmlUnescape: htmlUnescape,
		pregQuote: pregQuote,
		setNodeSelectDisabled: setNodeSelectDisabled,
		isEmptyObject: isEmptyObject,
		isPlainObject: isPlainObject,
		isFunction: isFunction,
		isScalar: isScalar,
		isBomOrDom: isBomOrDom,
		isBoolean: isBoolean,
		isString: isString,
		accessObject: accessObject,
		getU8StrLen: getU8StrLen,
		guid: guid,
		copy: copy,
		findParent:findParent,
		getFormData: getFormData,
		preventClickDelegate: preventClickDelegate
	};
});