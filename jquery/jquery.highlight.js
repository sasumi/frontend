/*

 highlight v5

 Highlights arbitrary terms.

 <http://johannburkard.de/blog/programming/javascript/highlight-javascript-text-higlighting-jquery-plugin.html>

 MIT license.

 Johann Burkard
 <http://johannburkard.de>
 <mailto:jb@eaio.com>
 */
jQuery.fn.highlight = function(pat){
	function innerHighlight(node, pat){
		var skip = 0;
		if(node.nodeType == 3){
			pat = new RegExp(pat, 'i');
			var pos = node.data.search(pat);
			if (pos >= 0 && node.data.length > 0) { // .* matching "" causes infinite loop
				var match = node.data.match(pat); // get the match(es), but we would only handle the 1st one, hence /g is not recommended
				var spanNode = document.createElement('span');
				spanNode.className = 'highlight'; // set css
				var middleBit = node.splitText(pos); // split to 2 nodes, node contains the pre-pos text, middleBit has the post-pos
				var endBit = middleBit.splitText(match[0].length); // similarly split middleBit to 2 nodes
				var middleClone = middleBit.cloneNode(true);
				spanNode.appendChild(middleClone);
				// parentNode ie. node, now has 3 nodes by 2 splitText()s, replace the middle with the highlighted spanNode:
				middleBit.parentNode.replaceChild(spanNode, middleBit);
				skip = 1; // skip this middleBit, but still need to check endBit
			}
		}
		else if(node.nodeType == 1 && node.childNodes && !/(script|style)/i.test(node.tagName)){
			for(var i = 0; i < node.childNodes.length; ++i){
				i += innerHighlight(node.childNodes[i], pat);
			}
		}
		return skip;
	}

	return this.length && pat && pat.length ? this.each(function(){
		innerHighlight(this, pat);
	}) : this;
};

jQuery.fn.removeHighlight = function(){
	return this.find("span.highlight").each(function(){
		this.parentNode.firstChild.nodeName;
		with(this.parentNode){
			replaceChild(this.firstChild, this);
			normalize();
		}
	}).end();
};