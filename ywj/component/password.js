/**
 * 密码输入辅助控件
 */
define('ywj/password', function (require) {
	require('ywj/resource/password.css');
	var lang = require('lang/$G_LANGUAGE');
	var $ = require('jquery');
	var Tip = require('ywj/tip');
	var Util = require('ywj/util');
	var $body = $('body');

	var STRENGTH_MAP = {
		0: lang('非常弱'),
		1: lang('弱'),
		2: lang('普通'),
		3: lang('强'),
		4: lang('非常强'),
		5: lang('安全'),
		6: lang('非常安全')
	};

	var m_strUpperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var m_strLowerCase = "abcdefghijklmnopqrstuvwxyz";
	var m_strNumber = "0123456789";
	var m_strCharacters = "!@#$%^&*?_~";

	/**
	 * 产生密码
	 * @param length 长度
	 * @param rule 规则
	 * @returns {string}
	 */
	var generate = function(length, rule){
		var MAP = [
			'0123456789',
			'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
			'abcdefghijklmnopqrstuvwxyz',
			'(!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~)',
			' '
		];
		rule = $.extend({
			'NUM': true, //数字
			'UC': true, //大写字母
			'LC': true, //小写字母
			'SYM': false, //符号
			'SPC': false //空格
		}, rule);
		var rules = [];
		if(rule.NUM){
			rules.push(MAP[0]);
		}
		if(rule.UC){
			rules.push(MAP[1]);
		}
		if(rule.LC){
			rules.push(MAP[2]);
		}
		if(rule.SYM){
			rules.push(MAP[3]);
		}
		if(rule.SPC){
			rules.push(MAP[4]);
		}
		var charset = rules.join(''),
			retVal = "";
		for (var i = 0, n = charset.length; i < length; ++i) {
			retVal += charset.charAt(Math.floor(Math.random() * n));
		}
		return retVal;
	};

	/**
	 * 获取密码强度文本
	 * @param strPassword
	 * @returns {*}
	 */
	var getStrengthText = function(strPassword){
		var strength = getStrength(strPassword);
		return STRENGTH_MAP[strength];
	};

	/**
	 * 获取密码强度
	 * @param strPassword
	 * @returns {number}
	 */
	var getStrength = function(strPassword){
		var score = calcComplexScore(strPassword);
		if(score >= 90){
			return 6;
		}
		if(score >= 80){
			return 5;
		}
		if(score >= 70){
			return 4;
		}
		if(score >= 60){
			return 3;
		}
		if(score >= 50){
			return 2;
		}
		if(score >= 25){
			return 1;
		}
		return 0;
	};

	/**
	 * 包含字符的个数
	 * @param strPassword
	 * @param strCheck
	 * @returns {number}
	 */
	var countContain = function(strPassword, strCheck){
		var nCount = 0;
		for(var i = 0; i < strPassword.length; i++){
			if(strCheck.indexOf(strPassword.charAt(i)) > -1){
				nCount++;
			}
		}
		return nCount;
	};

	/**
	 * 计算密码得分
	 * @param strPassword
	 * @returns {number}
	 */
	var calcComplexScore = function(strPassword){
		// Reset combination count
		var nScore = 0;

		// Password length
		// -- Less than 4 characters
		if(strPassword.length < 5){
			nScore += 5;
		}
		// -- 5 to 7 characters
		else if(strPassword.length > 4 && strPassword.length < 8){
			nScore += 10;
		}
		// -- 8 or more
		else if(strPassword.length > 7){
			nScore += 25;
		}

		// Letters
		var nUpperCount = countContain(strPassword, m_strUpperCase);
		var nLowerCount = countContain(strPassword, m_strLowerCase);
		var nLowerUpperCount = nUpperCount + nLowerCount;
		// -- Letters are all lower case
		if(nUpperCount == 0 && nLowerCount != 0){
			nScore += 10;
		}
		// -- Letters are upper case and lower case
		else if(nUpperCount != 0 && nLowerCount != 0){
			nScore += 20;
		}

		// Numbers
		var nNumberCount = countContain(strPassword, m_strNumber);
		// -- 1 number
		if(nNumberCount == 1){
			nScore += 10;
		}
		// -- 3 or more numbers
		if(nNumberCount >= 3){
			nScore += 20;
		}

		// Characters
		var nCharacterCount = countContain(strPassword, m_strCharacters);
		// -- 1 character
		if(nCharacterCount == 1){
			nScore += 10;
		}
		// -- More than 1 character
		if(nCharacterCount > 1){
			nScore += 25;
		}

		// Bonus
		// -- Letters and numbers
		if(nNumberCount != 0 && nLowerUpperCount != 0){
			nScore += 2;
		}
		// -- Letters, numbers, and characters
		if(nNumberCount != 0 && nLowerUpperCount != 0 && nCharacterCount != 0){
			nScore += 3;
		}
		// -- Mixed case letters, numbers, and characters
		if(nNumberCount != 0 && nUpperCount != 0 && nLowerCount != 0 && nCharacterCount != 0){
			nScore += 5;
		}
		return nScore;
	};

	return {
		generate:generate,
		getStrengthText:getStrengthText,
		getStrength: getStrength,
		calcComplexScore: calcComplexScore,
		nodeInit: function($inp, param){
			var name = $inp.attr('name');
			var required = !!$inp.attr('required');
			var is_set = param.isset;

			//rpt inputer
			var $rpt = $('<input type="password" value="" style="display:none" class="repeat-password txt" placeholder="'+lang('再次输入密码')+'"/>').insertAfter($inp);

			var $strength_trigger = $('<span class="ywj-password-strength ywj-password-strength-0"><span></span></span>').insertAfter($inp);
			$strength_trigger.css({
				width: $inp.outerWidth(),
				top: $inp.offset().top + $inp.outerHeight(),
				left: $inp.offset().left
			});

			//generator
			if(param.generator){
				var $generator = $('<span class="password-generator-btn" title="Help"></span>').insertAfter($inp);
				$generator.css({
					top: $inp.offset().top + 3,
					left: $inp.offset().left + $inp.outerWidth() - $generator.outerWidth()
				});

				var tpl = '<div class="ywj-password-generator-panel"><span class="t">'+lang('生成密码')
					+'</span> <input type="text" readonly="readonly"> <span class="ypg-refresh">'+lang('刷新')
					+'</span> <span class="ypg-copy">'+lang('复制')+'</span></div>';
				var oTip = new Tip(tpl, $generator);
				var $t = oTip.getDom().find('input[type=text]');
				var $r = oTip.getDom().find('.ypg-refresh');
				var $c = oTip.getDom().find('.ypg-copy');
				var tc;
				$t.focus(function(){
					$t[0].select($t[0]);
				});
				$r.click(function(){
					$c.html(lang('复制'));
					clearTimeout(tc);
					$t.val(generate(8, {LC: true, BC:true, NUM:true}));
				}).trigger('click');
				$c.click(function(){
					if($t.val()){
						Util.copy($t.val());
						$c.html(lang('已复制'));
						clearTimeout(tc);
						tc = setTimeout(function(){
							$c.html(lang('复制'));
						}, 2000);
					}
				});

				$generator.click(function(){oTip.show();});
				$body.click(function(e){
					var tag = e.target;
					var tc = oTip.getDom()[0];
					if(tag == $generator[0] || tag == tc || $.contains(tc, tag)){
						//
					} else {
						oTip.hide();
					}
				});
			}

			$rpt[0].oninvalid = function(){
				if(!this.value){
					this.setCustomValidity('');
				}
				else if(this.value != $inp.val()){
					this.setCustomValidity(lang('两次输入的密码不一致'));
				} else {
					this.setCustomValidity('');
				}
			};
			$rpt.on('input', function(){
				if(this.value == $inp.val()){
					this.setCustomValidity('');
				}
			});

			//input event
			$inp.on('input', function(){
				$rpt.val('').attr('required', false).hide();
				if($inp.val()){
					$rpt.attr('pattern', Util.pregQuote($inp.val()));
				}
				if(required || $inp.val()){
					$inp.attr('name', name);
					$rpt.attr('required', 'required').show();
				}
				if(is_set && !$inp.val()){
					$rpt.attr('required', false).hide();
				}
				if($inp.val()){
					var strength = getStrength($inp.val());
					$strength_trigger.attr('class', 'ywj-password-strength ywj-password-strength-'+strength);
				} else {
					$strength_trigger.attr('class', 'ywj-password-strength');
				}
			});

			//initialize edit mode
			if(is_set){
				//清除name提交数据
				$inp.attr('name', '').attr('required', false).val('');
				$inp.attr('placeholder', lang('输入新密码重置'));
			} else if(required){
				$inp.attr('placeholder', lang('请设置密码'));
			}
		}
	};
});