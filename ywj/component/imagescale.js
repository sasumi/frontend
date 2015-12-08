(function(scope){
	var __remove_css_class = function(c, node_class){
		var r = new RegExp('(\\s|^)' + c + '(\\s|$)', 'g');
		return node_class.replace(r, ' ');
	};

	/**
	 * 图片缩放
	 * @param opt
	 * @param org_region
	 * @returns {{width: string, height: string, marginLeft: string, marginTop: string}}
	 * @private
	 */
	var __img_scale__ = function(opt, org_region){
		var w = org_region.width,
			h = org_region.height;
		var ml = 0, mt = 0,
			scale = 1, scalew, scaleh;

		//缺省放大小图
		if(opt.zoom_out === undefined){
			opt.zoom_out = true;
		}

		if(opt.minWidth || opt.minHeight){
			scalew = opt.minWidth / w;
			scaleh = opt.minHeight / h;

			if(!opt.zoom_out && scalew > 1 && scaleh > 1){
				scalew = scaleh = 1;
			}

			scale = Math.max(scalew, scaleh);
			w = w * scale;
			h = h * scale;
			ml = -(w-opt.minWidth)/2;
			mt = -(h-opt.minHeight)/2;
		} else {
			scalew = opt.maxWidth / w;
			scaleh = opt.maxHeight / h;
			if(!opt.zoom_out && scalew > 1 && scaleh > 1){
				scalew = scaleh = 1;
			}

			scale = Math.min(scalew, scaleh);
			w = w * scale;
			h = h * scale;
			ml = (opt.maxWidth - w)/2;
			mt = (opt.maxHeight - h)/2;
		}

		return {
			width: parseInt(w, 10)+'px',
			height: parseInt(h, 10)+'px',
			marginLeft: parseInt(ml, 10)+'px',
			marginTop: parseInt(mt, 10)+'px'
		};
	};

	/**
	 * 图片缩放
	 * @param img
	 * @private
	 */
	var __img_adjust__ = function(img){
		//是否放大图片,如果该项没有设置,默认采用放大图片处理
		var zoom_out = img.getAttribute('data-zoom-out');
		zoom_out = (zoom_out == null) ? true : (zoom_out != '0');

		if(img.getAttribute('data-img-miss') == '1'){
			img.parentNode.className = __remove_css_class('g-img-error', img.parentNode.className);
			img.parentNode.className += ' g-img-miss';
			img.style.width = 'auto';
			img.style.height = 'auto';
			var ph = img.parentNode.offsetHeight;
			var pw = img.parentNode.offsetWidth;
			var h = img.height;
			var w = img.width;
			if(ph > h){
				img.style.marginTop = parseInt((ph-h)/2, 10)+'px';
			}
		} else {
			img.style.marginTop = '0';
			var c =  __remove_css_class('g-img-error', img.parentNode.className);
			img.parentNode.className =  __remove_css_class('g-img-miss', c);

			var minw = img.getAttribute('data-min-width');
			var minh = img.getAttribute('data-min-height');
			var maxw = img.getAttribute('data-max-width');
			var maxh = img.getAttribute('data-max-height');

			if(!minw && !minh && !maxw && !maxh){
				minh = img.parentNode.offsetHeight;
				minw = img.parentNode.offsetWidth;
			}

			if(minw || minh || maxw || maxh){
				img.style.height = 'auto';
				img.style.width = 'auto';
				var scale_style = __img_scale__({
					minWidth: minw,
					minHeight: minh,
					maxWidth: maxw,
					maxHeight: maxh,
					zoom_out: zoom_out
				}, {width:img.width, height:img.height});
				for(var i in scale_style){
					img.style[i] = scale_style[i];
				}
			}
		}
	};

	/**
	 * 图片加载错误
	 * @param img
	 * @private
	 */
	var __img_error__ = function(img){
		var c = img.parentNode.className;
		if(img.getAttribute('src')){
			c = __remove_css_class('g-img-miss', c);
			c += ' g-img-error';
		} else {
			c = __remove_css_class('g-img-error', c);
			c += ' g-img-miss';
		}
		img.parentNode.className = c;
	};
	scope.__img_adjust__ = __img_adjust__;
	scope.__img_error__ = __img_error__;
	scope.__img_scale__ = __img_scale__;
})(window);

define('ywj/imagescale', function(){
	return {
		scale: __img_scale__,
		onLoad: __img_adjust__,
		onError: __img_error__
	};
});
