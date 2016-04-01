(function(){
	var __remove_css_class = function(c, node_class){
		var r = new RegExp('(\\s|^)' + c + '(\\s|$)', 'g');
		return node_class.replace(r, ' ');
	};

	var pc = 'g-slide-img';
	var lc = 'g-slide-loading';

	window.detail_image_onload = function(img){
		if(!img.parentNode){
			return;
		}
		img.style.display = 'block';
		img.parentNode.className = pc;
		document.getElementById('g-slide').className = __remove_css_class(lc, document.getElementById('g-slide').className);
		__img_adjust__(img);
	};

	window.detail_image_onerror = function(img){
		if(!img.parentNode){
			return;
		}
		img.parentNode.className = pc;
		document.getElementById('g-slide').className = __remove_css_class(lc, document.getElementById('g-slide').className);
		__img_error__(img);
	};
})();