define('www/question', function(require){
	var $ = require('jquery');
	var net = require('ywj/net');
	var util = require('ywj/util');
	var msg = require('ywj/msg');
	var common = require('www/common');

	var strLen = function(str){
		if(!str){
			return 0;
		}
		return Math.ceil(util.getU8StrLen(str)/3);
	};

	$(function(){
		var $FORM = $('#ask-frm');
		var $CONTENT = $('#ask-content');
		var $CONTENT_COUNT = $('#content-count');
		var $EXT_CONTENT = $('.ask-ext-content');
		var $EXT_CONTENT_COUNT = $('.addition-field .word-count');
		var $ASK_INPUT_DIV = $('.main-field .ask-frm-input');

		var check_content_count = function($CON, MAX, $WC){
			if(!$CON.size()){
				return;
			}

			var placeholder_text = $CON.attr('placeholder');
			var cnt = strLen($CON.val());
			if($CON.val() == placeholder_text){
				cnt = 0;
			}

			var left = MAX - cnt;
			$WC[left>=0?'removeClass':'addClass']('word-count-overflow');
			if(left >= 0){
				$WC.html('您还可以输入 <b>'+left+'</b> 个字');
				$ASK_INPUT_DIV.removeClass('ask-frm-input-over');
			} else {
				$WC.html('内容已经超出 <b>'+(-left)+'</b> 个字');
				$ASK_INPUT_DIV.addClass('ask-frm-input-over');
			}
			$('#qs-content-tip').hide();
		};

		$('.addition-field legend').click(function(){
			var p = this.parentNode;
			var toHide = !$(p).hasClass('addition-hide');
			$(p)[toHide ? 'addClass':'removeClass']('addition-hide');
			$(p)[!toHide ? 'addClass':'removeClass']('addition-expand');
			if(!toHide){
				$('textarea', p).focus();
			}
		});

		//内容输入
		$CONTENT.change(function(){
			return check_content_count($CONTENT, question_title_max_words, $CONTENT_COUNT);
		});
		$CONTENT.keydown(function(){
			return check_content_count($CONTENT, question_title_max_words, $CONTENT_COUNT);
		});
		$CONTENT.keyup(function(){
			return check_content_count($CONTENT, question_title_max_words, $CONTENT_COUNT);
		});
		check_content_count($CONTENT, question_title_max_words, $CONTENT_COUNT);

		//内容输入
		$EXT_CONTENT.change(function(){
			return check_content_count($EXT_CONTENT, question_content_max_words, $EXT_CONTENT_COUNT);
		});
		$EXT_CONTENT.keydown(function(){
			return check_content_count($EXT_CONTENT, question_content_max_words, $EXT_CONTENT_COUNT);
		});
		$EXT_CONTENT.keyup(function(){
			return check_content_count($EXT_CONTENT, question_content_max_words, $EXT_CONTENT_COUNT);
		});
		check_content_count($EXT_CONTENT, question_content_max_words, $EXT_CONTENT_COUNT);

		//选分类
		$('.qs-categories li').click(function(){
			$('li',this.parentNode).removeClass('active');
			$(this).addClass('active');
			$('#category_id').val($(this).data('val'));
			$('#category-choose-tip').hide();
		});

		//提交
		$FORM.submit(function(){
			var val = $.trim($CONTENT.val());
			$CONTENT.val(val);
			if(!val){
				$('#qs-content-tip').html('请输入问题内容').show();
				return false;
			} else if(strLen(val) < question_title_min_words){
				$('#qs-content-tip').html('您输入的字数少于 '+question_title_min_words+'个中文').show();
				return false;
			}

			if(!$('#category_id').val()){
				$('#category-choose-tip').show();
				return false;
			}

			common.login(function(){
				var data = net.getFormData($FORM);
				var action = $FORM.attr('action');
				net.request(action, data, {
					method: 'post',
					onSuccess: function(rsp){
						msg.show(rsp.message, rsp.code==0 ? 'succ':'err');
						if(rsp.code == 0){
							location.href = rsp.jump_url || window['SUCC_URL'];
						}
					},
					onError: function(rsp){
						msg.show('系统繁忙，请稍后重试', 'err');
					}
				});
			});
			return false;
		});

		//最近回答滚动
		$(function(){
			setInterval(function(){
				var obj = $(".last-answer-list-wrap");
				$(obj).find(".last-answer-list").animate({
					marginTop : "-20px"
				},500,function(){
					$(this).css({marginTop : "0px"}).find("li:first").appendTo(this);
				})
			},3000)
		})
	});
});