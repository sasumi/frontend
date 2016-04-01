/**
 * 小区联想功能
 * Created by Windy on 2015/12/22.
 */
define('ywj/suggest_community', function(require){
	var $ = require('jquery');
	var net = require('ywj/net');
	var util = require('ywj/util');

	var SEARCH_COMMUNITY_URL = 'http://www.erp.com?r=search/community';
	var PAGE_NUM = 10;
	var DISABLED_CLICK_CLASS = 'disabled-click'; //上一页及下一页操作类名
	var suggestCommunityAidClass = 'suggestCommunityAid'; //用于联动的地区类名
	var suggestCommunityAddressClass = 'suggestCommunityAddress'; //用于联动的地址类名

	function init($community) {
		$('<style type="text/css">'+[
			'.suggestCommunity {position: absolute; background-color:#fff; box-sizing: border-box;}',
			'.suggestCommunity.s-border {border:1px solid #333; border-top:none;}',
			'.suggestCommunity ul {margin:0; padding:0}',
			'.suggestCommunity ul li{float:left;width:100%; height:25px; line-height:25px; cursor:pointer; text-indent:5px;  white-space: nowrap; text-overflow: ellipsis;}',
			'.suggestCommunity ul li:hover{background-color:#eee;}',
			'.suggestCommunity .page{height:20px;display:none;}',
			'.suggestCommunity a{display:block;}',
			'.suggestCommunity a.disabled-click{color:#BBB;}',
			'.suggestCommunity .pre{float:left;}',
			'.suggestCommunity .next{float:right;}',
			'.PopupDialog-btnDefault {}'].join('')
		+ '</style>')
			.appendTo($('head'));

		//get parent and set parent position
		var $parentContainer = $community.parent();
		$parentContainer.css({position:'relative'});
		var position = $community.position();
		var $parentForm = $community.parents('form');

		//$SCC the suggest community container
		var $SCC = $('<div class="suggestCommunity"><ul></ul><div class="page"><a href="javascript:;" class="pre">上一页</a><a href="javascript:;" class="next">下一页</a></div></div>').appendTo($parentContainer);
		var $SCU = $SCC.find('ul');
		var $OP_PAGE = $SCC.find('.page');
		var current_page = 1;

		var $communityId = ($parentForm.find('[name=community_id]').length > 0) ? $parentForm.find('[name=community_id]') :  $('<input type="hidden" value="" name="community_id">').appendTo($parentForm);
		var $communityAid = ($parentForm.find('[name=community_aid]').length > 0) ? $parentForm.find('[name=community_aid]') :  $('<input type="hidden" value="" name="community_aid">').appendTo($parentForm);

		//init container css
		$SCC.css({
			left:position.left,
			top:position.top + $community.outerHeight(),
			width:$community.outerWidth()
		});

		//close autoComplete
		$community.attr('autocomplete', 'off');
		$community.css('outline', 'none');

		$('body').click(function(e){
			if (e.target == $community[0]) {
				$SCC.show();
			}else if(e.target.parentElement == $SCU[0]){
				clickCommunityFunc($(e.target))
			}else{
				$SCC.hide();
				clearInterval(_timer);
			}
		});

		//auto suggest
		var _timer = null;
		var keyword = '';

		$community.focus(function(){
			_timer = setInterval(function () {
				var _kw = $.trim($community.val());
				if (_kw == '') {
					updateSuggest(null);
				}
				if (_kw != keyword) {
					getSuggestContent();
					$SCC.show();
				}
				keyword = _kw;

			}, 200);
		});

		$community.focusout(function(){
			clearInterval(_timer);
		});

		var _flag = true;
		function getSuggestContent() {
			var kw = $.trim($community.val());
			if (kw) {
				if (_flag) {
					_flag = false;
					net.get(SEARCH_COMMUNITY_URL, {kw:kw, p:current_page, num:PAGE_NUM}, function(r){
						if (r.code == 0) {
							updateSuggest(r.data.list);
							updatePage(r.data);
							keyword = kw;
							_flag = true;
						}
					}, {
						format:'jsonp',
						onError:function(){}
					});
				}
			}else{
				updateSuggest(null)
			}
		}

		//update suggest option
		function updateSuggest(data)
		{
			if (data && data.length > 0) {
				$OP_PAGE.show();
				var tpl = '';
				for (var i in data) {
					var cf = data[i];
					var name = cf.name.replace(/\[\[/g, '<b>').replace(/\]\]/g, '</b>');
					var tName = cf.name.replace(/\[\[/g, '').replace(/\]\]/g, '');
					tpl += '<li data-id="'+cf.id+'" data-aid="'+cf.aid+'" data-address="'+cf.address+'" title="'+tName+'">'+name+'</li>'
				}
				$SCU.html(tpl);
				$SCC.addClass('s-border');
			}else{
				$OP_PAGE.hide();
				$SCU.empty();
				$SCC.removeClass('s-border');
			}
		}



		//show page container
		function updatePage(data)
		{
			var $pre = $OP_PAGE.find('.pre');
			var $next = $OP_PAGE.find('.next');

			(data.list.length > 0) ? $OP_PAGE.show() : $OP_PAGE.hide();
			(current_page > 1) ? $pre.removeClass(DISABLED_CLICK_CLASS) : $pre.addClass(DISABLED_CLICK_CLASS);
			(data.total > current_page * PAGE_NUM) ? $next.removeClass(DISABLED_CLICK_CLASS) : $next.addClass(DISABLED_CLICK_CLASS);

		}

		//click the pre and next function
		function pageFunction(){
			$OP_PAGE.find('.pre, .next').click(function(){
				var _this = $(this);
				if (_this.hasClass(DISABLED_CLICK_CLASS)){
					return false;
				}

				_this.hasClass('pre') ? current_page-- : current_page++;
				getSuggestContent();
				return false;
			});
		}
		pageFunction();

		//click community(li)'s function
		function clickCommunityFunc($li)
		{
			choseCommunity($li);
			$SCC.hide();
			clearInterval(_timer);
		}

		//chose community
		function choseCommunity($li){
			var name = $li.text();
			var id = $li.data('id');
			var aid = $li.data('aid');
			$community.val(name);
			$communityId.val(id);
			$communityAid.val(aid);
			getSuggestContent();
			updateAidAndAddress($li)
		}


		//update the aid and address when clicked the community(li)
		function updateAidAndAddress($li)
		{
			var address = $li.data('address');
			var aid = $li.data('aid');
			var $suggestCommunityAid = $("." +suggestCommunityAidClass);
			var $suggestCommunityAddress = $("."+suggestCommunityAddressClass);
			if ($suggestCommunityAddress.length > 0) {
				$suggestCommunityAddress.val(address);
			}
			if ($suggestCommunityAid.length > 0 && aid) {
				$suggestCommunityAid.val(aid);
			}
		}
	}

	return init;
});