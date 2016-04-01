define('www/common', function(require){
	var $ = require('jquery');
	var msg = require('ywj/msg');
	var net = require('ywj/net');

	var showPopup = function(conf, onSuccess, onError){
		require.async('ywj/popup', function(Pop){
			var p = new Pop(conf);
			if(onSuccess){
				p.listen('onSuccess', onSuccess);
			}
			if(onError){
				p.listen('onError', onError);
			}
			p.show();
		});
	};

	/**
	 * 显示登陆框
	 * @param onSuccess
	 * @param opt
	 */
	var login = function(onSuccess, opt){
		if(window['IS_LOGIN']){
			onSuccess();
			return;
		}
		onSuccess = onSuccess || function(){};
		opt = $.extend({
			msg: true
		}, opt);
		var conf = {
			title: '用户登录',
			content: {src:LOGIN_DIALOG_URL},
			width: 420,
			moveEnable: true,
			topCloseBtn: true,
			buttons: []
		};
		showPopup(conf, function(rsp){
			if (rsp.data.user_info_tpl) {
				$("#userInfoTpl").replaceWith(rsp.data.user_info_tpl);
			}
			window['IS_LOGIN'] = true;
			if(opt.msg){
				msg.show('登录成功', 'succ', 1.5);
				setTimeout(onSuccess, 1500);
			} else {
				onSuccess();
			}
		});
	};

	/**
	 * logout async
	 * @param onSuccess
	 * @param opt
	 */
	var logout = function(onSuccess, opt){
		opt = $.extend({
			msg: true
		}, opt);
		if(!window['IS_LOGIN']){
			onSuccess();
		} else {
			net.get(LOGOUT_ASYNC_URL, {ref:'json'}, function(){
				if(opt.msg){
					msg.show('您已退出登录', 'succ', 1.5);
					setTimeout(onSuccess, 1500);
				} else {
					onSuccess();
				}
			});
		}
	};

	//初始化事件
	$(function(){
		var $body = $('body');

		//自动hover class
		$('*[data-hover]').hover(function(){
			$(this).addClass('hover');
		}, function(){
			$(this).removeClass('hover');
		});

		//自动slide
		$('.g-slide[data-autostart]').each(function(){
			var _this = this;
			seajs.use(['ywj/slide', 'jquerycolor'], function(S){
				var $list = $('.g-slide-list',_this);
				if($list.children()['length'] > 1){

					//init
					var setted_color = false;
					$list.children().each(function(idx){
						if(!setted_color && $(this).data('color')){
							setted_color = true;
							$('.slide-bg-wrap').animate({backgroundColor: $(this).data('color')});
						}
						if(idx){
							$(this).animate({opacity:1},0).hide();
						} else {
							$(this).show();
						}
					});

					//nav
					var $nav = $('.g-slide-nav', _this);
					var s = new S($list);
					if($nav.size()){
						$nav.children().click(function(){
							return false;
						});
						s.addControl($('.g-slide-nav', _this));
					}

					//ctrl2
					var $ctrl = $('.g-slide-ctrl', _this);
					if($ctrl.size()){
						$('a', $ctrl).click(function(){
							return false;
						});
						$('.g-slide-prev', $ctrl).mousedown(function(event){
							s.pause();
							s.switchToPre();
						});
						$('.g-slide-next', $ctrl).mousedown(function(event){
							s.pause();
							s.switchToNext();
						});
					}

					//event
					s.onSwitchTo = function($from, $to){
						/**
						var k = 'data-background-image';
						var bg = $to.attr(k);
						if(bg){
							$to.css('background-image', 'url('+bg+')');
							$to.attr(k, '');
						}
						**/
						$('.slide-bg-wrap').animate({
							backgroundColor: $to.data('color')
						}, 100);
						$nav.children().each(function(){
							$(this).removeClass('active');
						});
						$nav.children().eq($to.index()).addClass('active');
					};

					s.start(0);
				}
			});
		});

		//自动检测登录
		$body.delegate('*[data-need-login]', 'click', function(){
			var $this = $(this);
			if(!window['IS_LOGIN'] && !$this.data('login-clicked')){
				login(function(){
					$this.data('login-clicked', 1);
					if($this.data('login-reload')){
						location.reload();
					} else if($this.attr('href')){
						location.href = $this.attr('href');
					} else {
						$this.trigger('click');
					}
				});
				return false;
			}
			return true;
		});

		//退出
		$body.delegate('*[data-logout]', 'click', function(){
			var $this = $(this);
			if(window['IS_LOGIN'] && !$this.data('logout-clicked')){
				logout(function(){
					$this.data('logout-clicked', 1);
					if($this.data('logout-reload')){
						location.reload();
					} else if($this.attr('href')){
						location.href = $this.attr('href');
					} else {
						$this.trigger('click');
					}
				});
				return false;
			}
			return true;
		});


		//收藏文
		$body.delegate('*[rel=add-article-fav]', 'click', function(){
			var n = this;
			login(function(){
				net.get(n.href, null, function(rsp){
					if(rsp.code == 0){
						msg.show(rsp.message, 'succ');
						$(n).addClass('g-addfav-active-icon');
						var org_count = $(n).children().html();
						org_count = parseInt(org_count,10);
						$(n).children().html(org_count+1);
					} else {
						msg.show(rsp.message || '服务器繁忙，请稍后重试', 'err');
					}
				});
			});
			return false;
		});

		//收藏图
		$body.delegate('*[rel=add-img-fav]', 'click', function(){
			var n = this;
			login(function(){
				showPopup({
					title: '添加收藏',
					content: {src:n.href},
					width: 500
				}, function(){
					$(n).addClass('g-addfav-succ-icon');
					var org_count = $(n).children().html();
					org_count = parseInt(org_count,10);
					$(n).children().html(org_count+1);
				});
			});
			return false;
		});

		//鼠标滑过个人中心，弹出下拉框
	    $(".g-user-center").hover(function(){
	        $(this).addClass("g-pull-down");
	    },function(){
	    	$(this).removeClass("g-pull-down");
	    });

		//点赞
		$body.delegate('*[rel=add-like]', 'click', function(){
			var n = $(this);
			if(n.hasClass('g-like-succ-icon')){
				msg.show('您已经赞过', 'err');
				return false;
			}
			net.get(this.href, null, function(rsp){
				if(rsp.code == 0){
					msg.show(rsp.message, 'succ');
					n.addClass('g-like-succ-icon');
					var org_count = $(n).children().html();
					org_count = parseInt(org_count,10);
					$(n).children().html(org_count+1);

				} else {
					msg.show(rsp.message, 'err');
				}
			});
			return false;
		});

		//回复答案
		$body.delegate('*[rel=reply-answer]', 'click', function(){
			var url = this.href;
			login(function(){
				showPopup({
					title: '回复',
					content: {src: url},
					width: 500
				}, function(){
					location.reload();
				});
			});
			return false;
		});

		//低端浏览器hover效果
		if($.browser.msie && parseInt($.browser.version,10)<=9){
			require.async('ywj/placeholder', function(PL){
				$('input[placeholder], textarea[placeholder]').each(function(){
					PL(this, '', 'g-txt-focus', 'g-txt-empty');
				});
			});
		}

		//搜索
		var placeholder_map = {
			'image': '挑选您心仪的设计方案',
			'article': '了解装修的相关知识和技巧',
			'question': '解决您装修过程的疑问'
		};
		$('.g-search').each(function(){
			var $form = $(this);
			var $txt = $('input[type=text]', $form);
			$('#g-search-type-select').change(function(){
				var pl = placeholder_map[this.value];
				$txt.attr('placeholder', pl);
			});

			//select import
			$form.delegate('.g-select dd', 'click', function(){
				$txt.focus();
			});

			$form.submit(function(){
				var str = $.trim($txt.val());
				if(!str){
					msg.show('请输入您需要查找的内容', 'tip');
					$txt.focus();
					return false;
				}
			});
		});

		//装修全服务
		$(".function_tlt").hover(function(){
			$(this).find(".allser-btn").toggleClass("active");
			$(".function-tab").toggle();
		})
	});

	return {
		login: login,
		logout: logout
	};
});