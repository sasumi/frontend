define('temtop/dev',function(require){
	//random form
	var rf = require('temtop/RandomForm');
	setTimeout(function(){
		rf('form[method=post]');
	}, 100);

	//popup refresh btn
	$(function(){
		$('[data-component]').each(function(){
			var coms = $(this).data('component');
			if(/popup/i.test(coms)){
				$(this).attr('data-popup-toprefreshbtn', 1);
			}
		});
	});
});