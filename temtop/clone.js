define('temtop/clone',function(require, Util){
	require('temtop/resource/clone.css');
	var Util = require('ywj/util');
	var $current_input;
	var hide_tm;

	var $clone_btn = $('<div class="com-clone-icon" title="复制到其他输入框"></div>').appendTo('body');
	$clone_btn.click(function(){
		clearTimeout(hide_tm);
		console.log('click');
		var con = $clone_btn.data('content');
		var $scope = $($clone_btn.data('scope')).not($current_input);
		if(con){
			$scope.val(con).trigger('change');
		}
	});
	$clone_btn.hover(function(){
		var $scope = $($clone_btn.data('scope')).not($current_input);
		$scope.addClass('clone-input-highlight');
	}, function(){
		$($clone_btn.data('scope')).removeClass('clone-input-highlight')
	});

	var get_scope = function($node){
		var selector = $node[0].tagName;
		var cls = $node[0].classList.length ? '.'+ Util.toArray($node[0].classList).join('.') : '';
		var s = selector+ ($node.attr('type') ? '[type='+$node.attr('type')+']' : '')+(cls || ':not([class])');
		console.log(s);
		return s;
	};

	var show = function($node, scope){
		$current_input = $node;
		$clone_btn.data('content', $node.val())
			.data('scope', scope)
			.css({
				left: $node.offset().left + $node.outerWidth(),
				top: $node.offset().top
			})
			.show();
	};

	var hide = function(){
		return; //暂时不隐藏。
		console.log('hide');
		hide_tm = setTimeout(function(){
			console.log('hide tm');
			$clone_btn.hide();
		}, 1000);
	};

	return {
		nodeInit: function($node, param){
			param.scope = param.scope || get_scope($node);
			$node.on('focus keyup change', function(){
				if($(param.scope).size() > 1){
					show($node, param.scope);
				}
			});
			$node.on('blur', function(){
				hide();
			});
		}
	}
});