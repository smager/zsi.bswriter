/**
 * zsiBSWriter.js 
 * @author German M. Fuentes <gm.fuentes@gmail.com>
 * @copyright 2015 ZettaSolutions, Inc. <zetta-solutions.net>
 * @license under MIT  <https://github.com/smager/zsiBSwriter/blob/master/LICENSE>
 * @createddate  Feb-22-2015 
 **/
 /*
	dictionary:
 */


 var _ud = 'undefined';  
 
if(typeof zsi===_ud) zsi={};
zsi.bsWriter = function(config){
	//get new instance;
	var bsw =this;	
	
	if(typeof config.hasNoConfigFile === _ud) config.hasNoConfigFile=false;	
	if(config.hasNoConfigFile==true && typeof config.url===_ud ) throw new Error("hasNoConfigFile is set to false, url is required "); 		
	
	//get default config url
	config.url = (typeof config.url === _ud && config.hasNoConfigFile==false) ? config.url="templates/config.txt":config.url;
	
	//private variables
	this.__activeDiv="_activeDiv_";	
	//private functions
	this.__closeDiv=function(){
		$("." + bsw.__activeDiv).removeClass(bsw.__activeDiv);	
	}
	this.__getTemplate=function(p_tmp,info){
		var ts = bsw.__templates;
		for(var i=0;i<ts.length;i++){
			if(ts[i].name.toLowerCase()== p_tmp.toLowerCase()){
				if(!info.id) if(info.name) info.id=info.name; 
				if(!info.name) if(info.id) info.name=info.id;  
				
				if(info.labelsize) info.labelsize = "col-" + config.SizeType + "-" + info.labelsize
				if(info.inputsize) info.inputsize = "col-" + config.SizeType + "-" + info.inputsize

				return bsw.__compile(unescape(ts[i].html),info);						
			}		
		}
	}		
	this.__compile=function(tmp,data){				
		var template = Handlebars.compile(tmp);
		return template( data);				
	}

	//create prototype functions for node.
	this.__setFunction=function(fnName){			
		bsw.node.prototype[fnName] = function(jsonData){
			var h =  bsw.__getTemplate(fnName,jsonData);		
			$("." + bsw.__activeDiv).append(h);
			return this;												
		};
		
	}
	
	this.__loadTemplates=function(templates,node){		
		var loadedItems=0;
		
			for(var i=0;i<templates.length;i++){
				loadTemplate( templates[i].name, templates[i].url);
			}
			
			function loadTemplate(templateName,url){
				var _tmpl=templateName;
				$.get(url 
					,function (info){
						bsw.__templates.push({name:templateName,html:info});	
						bsw.__setFunction(templateName);
						loadedItems++;
						loadCompleted();
					}
				);	
			}
			
			function loadCompleted(){
				if(templates.length ==loadedItems) {
					if(typeof node.__loadComplete!==_ud) {
						node.__loadComplete();
					}
				}
			}
	}	 
	this.__templates=[];	
	
	//public functions 	
	this.write= function(callBackFunc){
		var node = new bsw.node();
		node.__loadComplete=callBackFunc;	
		$.getJSON(config.url,function onLoadComplete(data){
			if(config.hasNoConfigFile){				
				//if not using config file 
				//or using only single file 
				//or single data from the database for templates
				bsw.__templates = data;
				for(var i=0;i<data.length;i++){				
					bsw.__setFunction(data[i].name)
				}
				
				if(typeof node.__loadComplete!==_ud) node.__loadComplete();
			}
			else{
				bsw.__loadTemplates(data,node);							
			}
		});
				
	}
	
	this.node = function(){
		this.lastObj = $("." + config.targetClass).addClass(bsw.__activeDiv);			
	}	

	// node prototypes			
	this.node.prototype.div = function(jsonData){
		var _id="";
		var _guid = this.guid();
		bsw.__closeDiv();//close current div
		if(jsonData.id) _id ='id="' +  jsonData.id + '"';		
		var h ='<div ' + _id  + ' class="' + jsonData.class + ' ' + bsw.__activeDiv + ' ' + _guid + '"></div>';	

		if (jsonData.parentClass) 
			$("." + jsonData.parentClass).append(h);
		else
			this.lastObj.append(h);
		
		this.lastObj = $("." + _guid);
		 return this;
	}
		
	this.node.prototype.html = function(value){
		this.lastObj.html(value);	
		return this;
	}	
		
	this.node.prototype.prepend = function(value){
		this.lastObj.prepend(value);	
		return this;
	}
		
	this.node.prototype.append = function(value){
		this.lastObj.append(value);	
		return this;
	}		
		
	this.node.prototype.end = function(callBackFunc){
		bsw.__closeDiv();	
		//remove generated temporay class
		$('[class*="p___"]').each(function() {
			var _class = $(this).attr("class");
			$(this).attr("class",_class.substr(0,_class.indexOf("p___")));
		});	
		//delete unused objects.
		delete this.__loadComplete;
		delete this.lastObj;					
		if(callBackFunc) callBackFunc();
	}
	
	this.node.prototype.guid = function(){
		function S4() {
			return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		}
		return "p___" + (S4()+S4()).toLowerCase();
	}	

}
