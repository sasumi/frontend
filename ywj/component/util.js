/**
 * Created by sasumi on 2014/12/2.
 */
define('ywj/util', function(require){
	var $ = require('jquery');

	/**
	 * check item is in array
	 * @param item
	 * @param {array} arr
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

	/**
	 * check an object is an empty
	 * @param obj
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
	 * @param obj
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
		} else {
			return getType(value) != 'object' && getType(value) != 'function';
		}
	};

	/**
	 * check object is boolean
	 * @param obj
	 * @return {Boolean}
	 */
	var isBoolean = function(obj){
		return getType(obj) == 'boolean';
	};

	/**
	 * check object is a string
	 * @param obj
	 * @return {Boolean}
	 */
	var isString = function(obj){
		return getType(obj) == 'string';
	};

	/**
	 * check object is an array
	 * @param obj
	 * @return {Boolean}
	 */
	var isArray = function(obj){
		return getType(obj) == 'array';
	};

	/**
	 * check object is a function
	 * @param obj
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
	 * @param {Object} col dom collection
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
	 * generate GUID
	 * @return string
	 */
	var __guid = 0;
	var guid = function(){
		return '_ywj_guid_'+(++__guid);
	};

	return {
		getRegion: getRegion,
		toArray: toArray,
		inArray: inArray,
		isArray: isArray,
		getType: getType,
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
		findParent:findParent,
		getFormData: getFormData
	};
});