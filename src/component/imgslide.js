define('ywj/imgslide', function (require) {
	var imgslide_css_url = seajs.resolve('ywj/resource/imgslide.css');
	var tmpl = require('ywj/tmpl');

	var top_doc;

	try {
		top_doc = parent.document;
	} catch(ex){}
	top_doc = top_doc || document;
	$('head', top_doc).append('<link rel="stylesheet" type="text/css" href="'+imgslide_css_url+'"/>');

	var IMG_SLIDE_TPL = '<div class="ui-img-slide">' +
		'<div class="g-slide" data-hover="1" id="g-slide">'+
		'<ul class="g-slide-list"><li><span class="g-slide-img"><img src="<%=slide.current_img.src%>" alt="<%=slide.current_img.title%>" class="bigImg"></span></li></ul>'+
			'<div class="g-slide-tp">'+
				'<a class="g-slide-prev" href="javascript:void(0);"><span>上一张</span></a>'+
				'<a class="g-slide-next" href="javascript:void(0);"><span>下一张</span></a>'+
			'</div>'+
		'</div>'+
		'<p class="g-pic-intro"><%=slide.title%></p>'+
		'<div class="image-viewer-selector">'+
			'<a href="javascript:void(0);" class="slide-left-btn"><span>scroll left</span></a>'+
			'<a href="javascript:void(0);" class="slide-right-btn"><span>scroll right</span></a>'+
			'<div class="image-view-selector-content-wrap">'+
				'<ul class="image-viewer-selector-list" style="width: 5160px; margin-left: 0;">'+
				'<% for (var k=0; k<slide.img_list.length; k++){ var img = slide.img_list[k];%>' +
					'<li data-img_id="<%=k%>" class="uiSliderImg"><i></i>'+
						'<a href="javascript:void(0);" title="<%=img.title%>"><img src="<%=img.src%>" data-big_img="<%=img.big_img%>" alt="<%=img.title%>" onload="__img_adjust__(this)" data-min-width="85" data-min-height="85"></a>'+
					'</li>'+
				'<%}%>'+
				'</ul>'+
			'</div>'+
		'</div>'+
		'<a href="javascript:void(0);" title="点击关闭" class="scan-close"></a>'+
	'</div>'+
	'<div class="ui-img-layer"></div>';

	var IMG_SLIDE_DATA = {
		current_img: {
			index: 0,
			title: '',
			src: ''
		},
		img_list: [],
		title: '',
		group_id:'0_0'
	};

	var IMG_SLIDE = function () {
	};

	IMG_SLIDE.prototype = {
		config: {
			img_tag: "img[rel=slide-img]",
			img_parent_tag: "*[rel=img-slide]"
		},
		_TPL_OBJ: null,

		//初始化数据，根据当前img查找并组合数据
		_initData: function ($img) {
			var cfg = this.config;
			var $slideContainer = $img.parents(cfg.img_parent_tag);
			IMG_SLIDE_DATA.title = $slideContainer.attr("title") || '';
			IMG_SLIDE_DATA.group_id = $slideContainer.attr("slide-group");
			IMG_SLIDE_DATA.img_list = [];
			$slideContainer.find(cfg.img_tag).each(function (index) {
				var self = $(this);
				if (self.data('img_id') == $img.data('img_id')) {
					IMG_SLIDE_DATA.current_img = {
						index: index,
						title: self.attr('title') || '',
						src: self.data('big_img') || ''
					};
				}
				IMG_SLIDE_DATA.img_list.push({
					src: self.attr('src'),
					title: self.attr('title') || '',
					big_img: self.data('big_img') || ''
				});
			});
		},

		//初始化当前页的slide group
		_initSlideGroup: function () {
			var cfg = this.config;
			var group = [];
			$(cfg.img_parent_tag).each(function () {
				var _this = $(this);
				var slideGroup = _this.attr('slide-group');
				if (!slideGroup) {
					group[0] = isNaN(group[0]) ? 0 : ++group[0];
					_this.attr('slide-group', 0+'_'+group[0]);
				}else{
					group[slideGroup] = isNaN(group[slideGroup]) ? 0 : ++group[slideGroup];
					_this.attr('slide-group', slideGroup+'_'+group[slideGroup]);
				}

				_this.find(cfg.img_tag).each(function(index){
					$(this).data('img_id',index);
				});
			});
		},

		//格化式slide的html
		_formatHtml: function () {
			this._TPL_OBJ = $(tmpl(IMG_SLIDE_TPL, {slide:IMG_SLIDE_DATA}));
		},

		//下一个图片集
		_nextGroup: function(){
			var cfg = this.config;
			var that = this;
			var cg = IMG_SLIDE_DATA.group_id;
			var cg_arr = cg.split('_');
			var ng = cg_arr[0]+'_'+(parseInt(cg_arr[1])+1);
			var $nextGroup = $('*[slide-group='+ng+']');
			if ($nextGroup.length <= 0) {
				return false;
			}

			var $img = $nextGroup.find(cfg.img_tag).first();
			that.close();
			$img.click();
		},

		//上一个图片集
		_preGroup:function(){
			var cfg = this.config;
			var that = this;
			var cg = IMG_SLIDE_DATA.group_id;
			var cg_arr = cg.split('_');
			var ng = cg_arr[0]+'_'+(parseInt(cg_arr[1])-1);
			var $nextGroup = $('*[slide-group='+ng+']');
			if ($nextGroup.length <= 0) {
				return false;
			}

			var $img = $nextGroup.find(cfg.img_tag).last();
			that.close();
			$img.click();
		},

		//初始化
		init: function () {
			var cfg = this.config;
			var that = this;
			that._initSlideGroup();

			$('body').delegate(cfg.img_tag, 'click', function(){
				that._initData($(this));
				that._formatHtml();
				that.show();
			});
		},

		//绑定事件
		handleEvent: function(){
			var that = this;
			var PER_WIDTH = 86;
			var $CLOSE_BTN = this._TPL_OBJ.find(".scan-close");

			var $SLIDE_IMG = this._TPL_OBJ.find(".uiSliderImg");
			var $SELECTOR = this._TPL_OBJ.find('.image-viewer-selector-list');
			var $SELECTOR_WRAP = this._TPL_OBJ.find('.image-view-selector-content-wrap');
			var $SLIDE_NEXT = this._TPL_OBJ.find('.slide-right-btn,.g-slide-next');
			var $SLIDE_PREV = this._TPL_OBJ.find('.slide-left-btn,.g-slide-prev');
			var $BIG_IMG = this._TPL_OBJ.find('.bigImg');

			function moveCenter(){
				if($SELECTOR.outerWidth() < $SELECTOR_WRAP.outerWidth()){
					return;
				}

				var maxMoveNum = IMG_SLIDE_DATA.img_list.length - $SELECTOR_WRAP.outerWidth()/PER_WIDTH;
				var cur = $('.active', $SELECTOR);
				var center_left = $SELECTOR_WRAP.outerWidth()/2;
				var now_left = $(cur).offset().left - $SELECTOR.offset().left + $(cur).outerWidth()/2;
				var ml = now_left - center_left;

				ml = Math.min(ml, maxMoveNum*PER_WIDTH);
				$SELECTOR.animate({
					marginLeft: ml>0 ? -ml : 0
				}, 300);
			}

			//向右移动
			function moveRight(){
				var maxMoveNum = IMG_SLIDE_DATA.img_list.length - $SELECTOR_WRAP.outerWidth()/PER_WIDTH;
				maxMoveNum = maxMoveNum <= 0 ? 0 : maxMoveNum;
				var moveLeft = parseInt($SELECTOR.css('margin-left'));
				var ml = (moveLeft - PER_WIDTH) > 0 ? 0 : moveLeft - PER_WIDTH;
				$SELECTOR.stop().animate({
					marginLeft: Math.max(ml, -maxMoveNum*PER_WIDTH)
				}, 300);
			}

			//向左移动
			function moveLeft(){
				var moveLeft = parseInt($SELECTOR.css('margin-left'));
				if (moveLeft >= 0) {
					return false;
				}
				$SELECTOR.stop().animate({
					marginLeft: Math.min(moveLeft + PER_WIDTH, 0)
				}, 300);
			}

			function showBigImg($img){
				$BIG_IMG.attr({
					title:$img.attr('title'),
					src:$img.data("big_img")
				});
			}

			function changeSize()
			{
				var bigImgMaxHeight = $(window).height() - $SELECTOR_WRAP.outerHeight() - 40;
				$BIG_IMG.css("max-height",bigImgMaxHeight);
			}

			$(window).resize(function(){
				changeSize();
			});

			//小图片点击
			$SLIDE_IMG.click(function(){
				var _this = $(this);
				var curId = parseInt(_this.data('img_id'));
				var $active = $SELECTOR.find(".active");

				if ($active.length > 0) {
					var activeId = parseInt($active.data('img_id'));

					if (_this.hasClass("active")) {
						return false;
					}

					if (curId > activeId) {
						moveRight();
					}

					if (curId < activeId && curId >= 0) {
						moveLeft();
					}
					$active.removeClass("active");
					_this.addClass("active");
				}else{
					_this.addClass("active");
					moveCenter();
				}

				showBigImg(_this.find("img"));
			});

			//点击下一个
			$SLIDE_NEXT.click(function(){
				var $next = $SELECTOR.find(".active").next();
				if ($next.length > 0) {
					$next.click();
				}else{
					that._nextGroup();
				}
			});

			//点击向一个
			$SLIDE_PREV.click(function(){
				var $pre = $SELECTOR.find(".active").prev();
				if ($pre.length > 0) {
					$pre.click();
				}else{
					that._preGroup();
				}
			});

			//点击关闭
			$CLOSE_BTN.click(function(){
				that.close();
			});
		},

		//显示
		show: function () {
			this.handleEvent();
			$('body').append(this._TPL_OBJ);
			this._TPL_OBJ.find('[data-img_id='+IMG_SLIDE_DATA.current_img.index+']').click();
			$(window).resize();
		},

		//关闭
		close: function () {
			this._TPL_OBJ.remove();
		}

	};
	return new IMG_SLIDE;
});