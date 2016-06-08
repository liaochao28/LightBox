;(function($){

	var LightBox = function(setting){
		var self = this;

		this.setting = {
			speed:500
		};

		$.extend(this.setting, setting || {});

		//创建遮罩层
		this.popupMask = $("<div class=\"lightbox-mask\"></div>");
		this.popupWin = $("<div class=\"lightbox-popup\"></div>");
		//保存body
		this.bodyNode = $(document.body);

		//绘制剩余DOM
		this.renderDOM();

		this.picViewArea = this.popupWin.find("div.lightbox-pic-view");
		this.popupPic = this.popupWin.find("img.lightbox-image");
		this.picCaptionArea = this.popupWin.find("div.lightbox-pic-caption");
		this.prevBtn = this.popupWin.find("span.lightbox-prev-btn");
		this.nextBtn = this.popupWin.find("span.lightbox-next-btn");

		this.picCaptionText = this.picCaptionArea.find("h4.lightbox-desc");
		this.currentText = this.picCaptionArea.find("p.lightbox-pic-index");
		this.closeBtn = this.picCaptionArea.find("span.lightbox-close-btn");

		//为所有图片委托事件，获取当前组图片数据
		this.groupName = null;
		this.groupData = [];
		this.bodyNode.delegate(".js-lightbox,*[data-role=lightbox]","click",function(e){

			e.stopPropagation();

			var currentGroupName = $(this).attr("data-group");
			if( currentGroupName !== self.groupName ){

				self.groupName = currentGroupName;
				self.getGroup();
			}

			//初始化弹窗
			self.initPopup($(this));


			//关闭弹窗
			self.popupMask.click(function(){
				$(this).fadeOut();
				self.popupWin.fadeOut();
				self.clear = false;
			});
			self.closeBtn.click(function(){
				self.popupMask.fadeOut();
				self.popupWin.fadeOut();
				self.clear = false;
			});

			//绑定上下按钮的x显示/隐藏切换
			this.flag = true;
			self.nextBtn.hover(function(){
									if(!$(this).hasClass("disabled") && self.groupData.length > 1){
										$(this).addClass("lightbox-next-btn-show");
									}
								},
								function(){
									if(!$(this).hasClass("disabled") && self.groupData.length > 1){
										$(this).removeClass("lightbox-next-btn-show");
									}
								}).click(function(e){

									if(!$(this).hasClass("disabled") && self.groupData.length > 1 && self.flag){
										self.flag = false;

										e.stopPropagation();
										self.goto("next");
									}
								});

			self.prevBtn.hover(function(){
									if(!$(this).hasClass("disabled") && self.groupData.length > 1){
										$(this).addClass("lightbox-prev-btn-show");
									}
								},
								function(){
									if(!$(this).hasClass("disabled") && self.groupData.length > 1){
										$(this).removeClass("lightbox-prev-btn-show");
									}
								}).click(function(e){
									
									if(!$(this).hasClass("disabled") && self.groupData.length > 1 && self.flag){
										self.flag = false;
										e.stopPropagation();
										self.goto("prev");
									}
								});
		});


		//绑定窗口调整事件
		var timer = null;
		this.clear = false;
		$(window).resize(function(){

			clearTimeout(timer);
			if(self.clear){
				timer = setTimeout(function(){
					self.loadPicSize(self.groupData[self.index].src);
				},500);
			}
		}).keyup(function(e){
			var e = e || window.event;
			var keyCode = e.keyCode || e.which;

			if(keyCode === 37 || keyCode === 38){

				self.prevBtn.click();
			}else if(keyCode === 39 || keyCode === 40){

				self.nextBtn.click();
			}
		});

	};

	LightBox.prototype = {
		goto: function(dir){
			var self = this;

			if(dir === "next"){

				this.index++;

				if(this.index >= this.groupData.length-1){
					this.nextBtn.addClass("disabled").removeClass("lightbox-next-btn-show");
				}
				if(this.index !== 0){
					this.prevBtn.removeClass("disabled");
				}
				this.loadPicSize(this.groupData[this.index].src);

			}else if(dir === "prev"){

				this.index--;

				if(this.index <= 0){
					this.prevBtn.addClass("disabled").removeClass("lightbox-prev-btn-show");
				}
				if(this.index !== this.groupData.length-1){
					this.nextBtn.removeClass("disabled");
				}
				this.loadPicSize(this.groupData[this.index].src);

			}
		},

		//根据视口及图片的宽高比 设置视口设置宽高并添加过度动画
		changePic: function(picW,picH){

			var self = this;
			var winWidth = $(window).width();
			var winHeight = $(window).height();

			var scale = Math.min(winWidth/(picW+10),winHeight/(picH+10),1);

			picW = picW*scale;
			picH = picH*scale;

			self.picViewArea.animate({
										width: picW,
										height: picH
									},self.setting.speed);

			self.popupWin.animate({
									width: picW,
									height: picH,
									marginLeft: -(picW/2),
									top: (winHeight-picH)/2
								}, self.setting.speed,function(){
									self.popupPic.css({
										width: picW - 10,
										height: picH - 10
									}).fadeIn();

									self.picCaptionArea.fadeIn();

									//动画完成后才可以进行下次切换（点击上下按钮）
									self.flag = true;

									//window resize 时 只有当弹出层处于弹出状态时 才调整弹窗大小
									self.clear = true;
								});

			//设置描述文字及索引
			this.picCaptionText.text(this.groupData[this.index].caption);
			this.currentText.text("当前位置：" + (this.index + 1) + " of " + this.groupData.length)

		},

		loadPicSize: function(sourceSrc){
			var self = this;

			self.popupPic.css({height:"auto",width:"auto"}).hide();
			this.picCaptionArea.hide();

			this.preLoadImg(sourceSrc,function(){

				var picWidth = 0;
				var picHeight = 0;

				self.popupPic.attr("src",sourceSrc);

				picWidth = self.popupPic.width();
				picHeight = self.popupPic.height();
				//alert(picWidth+","+picHeight);

				self.changePic(picWidth,picHeight);

			});
		},

		//预加载图片
		preLoadImg: function(src,callback){

			var img = new Image();
			if(!!window.ActiveXObject){
				img.onreadystatechange = function(){
					if(this.readyState === "complete"){
						callback && callback();
					}
				};
			}else{
				img.onload = function(){
					callback && callback();
				};
			}
			img.src = src;
		},

		//显示遮罩层及图片
		showMaskAndPopup: function(sourceSrc,currentId){

			var self = this;

			var winWidth = $(window).width();
			var winHeight = $(window).height();
			var viewHeight = winHeight/2+10;

			var groupLength = this.groupData.length;

			this.popupPic.hide();
			this.picCaptionArea.hide();

			this.popupMask.fadeIn();

			this.picViewArea.css({
									width: winWidth/2,
									height: winHeight/2
								});

			this.popupWin.fadeIn();

			this.popupWin.css({
								width: winWidth/2,
								height: winHeight/2,
								marginLeft: -(winWidth/2)/2,
								top: -viewHeight
							}).animate({
								top:(winHeight-viewHeight)/2
							},self.setting.speed,function(){
								//加载图片
								self.loadPicSize(sourceSrc);
							});

			//根据当前点击图片的id 获取图片在当前组的索引
			this.index = this.getIndexOf(currentId);

			if(groupLength > 1){

				if(this.index === 0){
					this.prevBtn.addClass("disabled");
					this.nextBtn.removeClass("disabled");
				}else if(this.index === groupLength-1){
					this.prevBtn.removeClass("disabled");
					this.nextBtn.addClass("disabled");
				}else{
					this.prevBtn.removeClass("disabled");
					this.nextBtn.removeClass("disabled");
				}

			}
		},

		getIndexOf: function(currentId){

			var index = 0;

			$(this.groupData).each(function(i){
				index = i;

				if(this.id === currentId){
					return false;
				}
			});

			return index
		},

		initPopup: function(currendObj){

			var self = this;
			var sourceSrc = currendObj.attr("data-source");
			var currentId = currendObj.attr("data-id");

			this.showMaskAndPopup(sourceSrc,currentId);
		},

		getGroup: function(){
			var self = this;

			//根据组名 获取同一组的所有图片
			var groupList = this.bodyNode.find("*[data-group="+ self.groupName +"]");

			//每次获取 先清空前一次获取的数据
			this.groupData = [];

			$.each(groupList,function(){
				self.groupData.push({
										src: $(this).attr("data-source"),
										id: $(this).attr("data-id"),
										caption: $(this).attr("data-caption")
									});
			});
		},

		renderDOM: function(){
			var strDOM = "<div class=\"lightbox-pic-view\">"+
					        "<span class=\"lightbox-btn lightbox-prev-btn\"></span>"+
					        "<img class=\"lightbox-image\" src=\"\" alt=\"\">"+
					        "<span class=\"lightbox-btn lightbox-next-btn\"></span>"+
					     "</div>"+
					     "<div class=\"lightbox-pic-caption\">"+
					        "<div class=\"lightbox-caption-area\">"+
					          "<h4 class=\"lightbox-desc\"></h4>"+
					          "<p class=\"lightbox-pic-index\">图片索引：</p>"+
					        "</div>"+
					        "<span class=\"lightbox-close-btn\">×</span>"+
					     "</div>";
	     
			this.popupWin.html(strDOM);
			this.bodyNode.append(this.popupMask).append(this.popupWin);
		}

	};

	window["LightBox"] = LightBox;


})(jQuery);