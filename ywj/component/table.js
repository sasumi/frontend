/**
 * 表格的相关操作
 */
define('ywj/table',function(require){
	//删除
	var delRow = function(row, allow_empty){
		if(!allow_empty && row.parent().children().size() == 1){
			return false;
		}
		row.remove();
	};

	//追加
	//TODO 暂时不支持ie8
	var appendRow = function(tpl, table){
		var app = $(tpl).appendTo(table);
		if($('input[rel=upload-image]', app).size()){
			require.async('ywj/simpleimageuploader', function(U){
				new U($('input[rel=upload-image]', app), {
					UPLOAD_URL: window['UPLOAD_URL']
				});
			});
		}
		if($('input[rel=upload-file]', app).size()){
			require.async('ywj/simplefileuploader', function(U){
				new U($('input[rel=upload-file]', app), {
					UPLOAD_URL: window['UPLOAD_URL']
				});
			});
		}
	};

	//上移
	var moveUp = function(row){
		var idx = row.index();
		if(idx == 0){
			return false;
		}
		var pre = row.parent().children()[idx-1];
		row.insertBefore(pre);
	};

	//下移
	var moveDown = function(row){
		var idx = row.index();
		var total = row.parent().children().size();
		if(idx == (total-1)){
			return false;
		}
		var next = row.parent().children()[idx+1];
		row.insertAfter(next);
	};

	return {
		deleteRow: delRow,
		appendRow: appendRow,
		moveUpRow: moveUp,
		moveDownRow: moveDown
	};
});