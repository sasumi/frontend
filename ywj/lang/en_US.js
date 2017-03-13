define('lang/en_US', function (require) {
	window['LANG_PACKAGE'] = window['LANG_PACKAGE'] || {};
	window['LANG_PACKAGE']['en_US'] = {
		'后台有点忙，请稍后重试': 'system busy, please try latter...',
		'无数据':'no data found',
		'关闭(ESC)':'close(ESC)',
		'正在提交请求...':'submitting...',
		'确认':'confirm',
		'取消':'cancel',
		'本功能使用了CLodop云打印服务,请点击这里':'this function require CLodop print service, click here',
		'下载':'download',
		'网络较慢还在提交数据，请稍侯...':'the network is slow, please wait ...',
		'系统繁忙，请稍后(-1)':'system busy now, please wait ...',
		'请按 Ctrl+C 复制': 'Press Ctrl+C to copy',
		'已复制': 'copied',
		'复制': 'copy',
		'对话框': 'dialog',
		'非常弱': 'very weak',
		'弱': 'weak',
		'普通': 'normal',
		'强': 'strong',
		'非常强': 'very strong',
		'安全': 'safe',
		'非常安全': 'very safe',
		'再次输入密码': 'repeat password',
		'生成密码': 'generate password',
		'刷新': 'refresh',
		'两次输入的密码不一致': 'difference between tow password',
		'输入新密码重置': 'type password to reset',
		'请设置密码': 'password please'
	};
	return require('ywj/lang');
});