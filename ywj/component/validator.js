define('ywj/validator', function(require){
	var $ = require('jquery');
	var util = require('ywj/util');

	//使用到的正则表达式
	var REGEXP_COLLECTION = {
		REQUIRE: /^.+$/,									//必填
		CHINESE_ID: /^\d{14}(\d{1}|\d{4}|(\d{3}[xX]))$/,	//身份证
		PHONE: /^[0-9]{7,13}$/,								//手机+固话
		EMAIL: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/,		//email
		POSTCODE: /^[0-9]{6}$/,								//邮编
		AREACODE: /^0[1-2][0-9]$|^0[1-9][0-9]{2}$/,			//区号
		CT_PASSPORT: /^[0-9a-zA-Z]{5,40}$/,					//电信账号
		CT_MOBILE: /^(13|15|18)[0-9]{9}$/,					//中国电信号码
		QQ: /^\d{5,13}$/,
		TRIM: /^\s+|\s+$/g
	};

	var isEmptyObject = function(obj){
		for(var i in obj){
			return false;
		}
		return true;
	};

	/**
	 * 检测radio是否被选中
	 * @param element
	 * @returns {boolean}
	 */
	var checkRadioChecked = function(element){
		var elements = this.form[0].elements;
		var name = element.name;

		for(var i=0; i<elements.length; i++){
			if(elements[i].name == name && !!elements[i].checked){
				return true;
			}
		}
		return false;
	};

	/**
	 * 表单元素是否合适用于表单校验
	 * @param element
	 * @returns {boolean}
	 */
	var elementCheckAble = function(element){
		return element.tagName != 'FIELDSET' &&
		element.type != 'hidden' &&
		element.type != 'submit' &&
		element.type != 'button' &&
		element.type != 'reset' &&
		element.type != 'image';
	};

	/**
	 * 表单校验
	 * @param form
	 * @param rules
	 * @example
	 * /**
	 'name': {
				require: '请输入用户名称',
				max20: '最大长度为20个字符',
				min4: '最小长度为4个字符'
				},
	 'password': {
					require: '请输入用户密码',
					min6: '最小长度为6个字符',
					max32: '最大长度为32个字符'
				},
	 'date': {
					date: '请输入正确的日期格式'
				}
	 *
	 * @param config
	 * @constructor
	 */
	var Va = function(form, rules, config){
		this.form = $(form);
		this.rules = rules;
		this.config = $.extend({
			breakOnError: false,
			passClass: 'validate-pass',
			failClass: 'validate-fail',
			tipClass: 'validate-tip'
		}, config);
	};

	Va.prototype.attach = function(){
		var _this = this;
		this.form.on('submit', function(){
			var err = _this.checkAll();
			if(err){
				return false;
			}
		});
	};

	/**
	 * 检查单个表单元素
	 * @param element
	 * @param rules
	 */
	Va.prototype.checkItem = function(element, rules){
		if(!rules){
			return null;
		}

		var elements = this.form[0].elements;
		var errors = [];
		var uKey, len, ret;
		var breakOnError = this.config.breakOnError;

		if(element.tagName == 'SELECT' ||
			(element.tagName == 'INPUT' && (element.type == 'text' || element.type == 'password'))){
			var val = element.value.replace(REGEXP_COLLECTION.TRIM, '');
			for(var key in rules){
				uKey = key.toUpperCase();

				//函数模式
				if(typeof(rules[key]) == 'function'){
					ret = rules[key](val, element);
					if(ret){
						if(!breakOnError){
							return [ret];
						} else {
							errors.push(ret);
						}
					}
				}

				//正则表命中
				else if(REGEXP_COLLECTION[uKey]){
					if(!REGEXP_COLLECTION[uKey].test(val)){
						if(!breakOnError){
							return [rules[key]];
						} else {
							errors.push(rules[key]);
						}
					}
				}

				//最大长度
				else if(uKey.indexOf('MAX') === 0){
					len = parseInt(uKey.substr(3), 10);
					if(len > 0 && len < val.length){
						if(!breakOnError){
							return [rules[key]];
						} else {
							errors.push(rules[key]);
						}
					}
				}

				//最小长度
				else if(uKey.indexOf('MIN') === 0){
					len = parseInt(uKey.substr(3), 10);
					if(len > 0 && len > val.length){
						if(!breakOnError){
							return [rules[key]];
						} else {
							errors.push(rules[key]);
						}
					}
				}

				//自定义正则表达式
				else if(uKey.indexOf('/') === 0){
					var reg = new RegExp(key);
					if(!reg.test(val)){
						if(!breakOnError){
							return [rules[key]];
						} else {
							errors.push(rules[key]);
						}
					}
				}

			}
		}

		//checkbox 模式仅有require模式
		else if(element.type == 'checkbox'){
			for(key in rules){
				uKey = key.toUpperCase();
				if(uKey == 'REQUIRE'){
					if(!element.checked){
						if(typeof(rules[key]) == 'function'){
							ret = rules[key](element.checked, element);
							return [ret];
						} else {
							return [rules[key]];
						}
					} else {
						return null;
					}
				}
			}
		}

		//radio 模式仅有require模式
		else if(element.type == 'radio'){
			for(var key in rules){
				uKey = key.toUpperCase();
				if(uKey == 'REQUIRE'){
					if(!checkRadioChecked.call(this, element)){
						return [rules[key]];
					} else {
						return null;
					}
				}
			}
		}
		return errors;
	};

	Va.prototype.onBeforeCheck = function(){

	};

	/**
	 * 检查所有表单元素
	 * @returns {{}}
	 */
	Va.prototype.checkAll = function(){
		this.onBeforeCheck();
		this.resetError();
		var errors = {};
		var error_flag = false;
		var _this = this;

		var elements = this.form[0].elements;
		$.each(elements, function(){
			if(elementCheckAble(this)){
				var name = this.name;

				//跳过已经检查的radio
				if(this.type == 'radio' && errors[this.name] || !_this.rules[name]){
					return;
				}

				var errs = _this.checkItem(this, _this.rules[name]);
				_this.onItemChecked(this, errs);
				if(!isEmptyObject(errs)){
					errors[name] = errs;
					error_flag = true;
					if(_this.config.breakOnError){
						return false;
					}
				}
			}
		});

		return error_flag ? errors : null;
	};

	/**
	 * 表单检查完
	 * @param element
	 * @param errors
	 * @returns {*}
	 */
	Va.prototype.onItemChecked = function(element, errors){
		if(!isEmptyObject(errors)){
			return this.onItemCheckFail(element, errors);
		} else {
			return this.onItemCheckPass(element);
		}
	};

	/**
	 * 设置元素错误信息
	 * @param element
	 * @param errors
	 */
	Va.prototype.setItemMessage = function(element, errors){
		var pass = isEmptyObject(errors);

		$(element)[pass ? 'addClass' : 'removeClass'](this.config.passClass)[pass ? 'removeClass' : 'addClass'](this.config.failClass);

		var pn = $(element.parentNode);
		var tip = $('span.'+this.config.tipClass, pn);
		if(!tip.size()){
			tip = $('<span class="'+this.config.tipClass+'"></span>').appendTo(pn);
		}

		$(tip)[pass ? 'addClass' : 'removeClass'](this.config.passClass)[pass ? 'removeClass' : 'addClass'](this.config.failClass).html(errors[0]);
	};

	/**
	 * on item check pass event
	 * @param element
	 */
	Va.prototype.onItemCheckPass = function(element){
		this.setItemMessage(element, []);
	};

	/**
	 * on item check fail event
	 * @param element
	 * @param errors
	 */
	Va.prototype.onItemCheckFail = function(element, errors){
		this.setItemMessage(element, errors);
	};

	/**
	 * 重置所有错误信息
	 * @param element
	 */
	Va.prototype.resetError = function(element){
		$('span.'+this.config.tipClass, this.form).removeClass(this.config.passClass).removeClass(this.config.failClass).html('');
	};

	Va.REGS = REGEXP_COLLECTION;
	return Va;
});