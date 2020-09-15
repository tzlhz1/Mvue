const complieUtil = {
    getValue(expr,vm){
        return expr.split('.').reduce((pre,cur)=>pre[cur],vm.$data)
    },
    setValue(expr,vm,value){
        return expr.split('.').reduce((pre,cur)=>{
            pre[cur]=value
        },vm.$data)
    },
    getTextContent(expr,vm){
        return  expr.replace(/\{\{(.+?)\}\}/g,(...agrs)=>{
            return this.getValue(agrs[1],vm)
        })
    },
    text(node,expr,vm){
        
        let value 
        if(expr.indexOf('{{')!==-1){
            value = expr.replace(/\{\{(.+?)\}\}/g,(...agrs)=>{
                new Watcher(vm,agrs[1],()=>{
                    this.updater.text(node,this.getTextContent(expr,vm))
                })
                return this.getValue(agrs[1],vm)
            })
            
        }else{
            new Watcher(vm,expr,(newValue)=>{
                this.updater.text(node,newValue)
            })
            value = this.getValue(expr,vm)
        }
         
        this.updater.text(node,value)
    },
    html(node,expr,vm){
        const value = this.getValue(expr,vm)
        new Watcher(vm,expr,(newValue)=>{
            this.updater.html(node,newValue)
        })

        this.updater.html(node,value)
    },
    model(node,expr,vm){
        const value = this.getValue(expr,vm)
        //绑定更新函数 数据=>视图
        new Watcher(vm,expr,(newValue)=>{
            this.updater.model(node,newValue)    
        })

        //视图=>数据=>视图
        node.addEventListener('input',(e)=>{
            this.setValue(expr,vm,e.target.value)
        })
        this.updater.model(node,value)
    },
    on(node,expr,vm,eventName){
        this.updater.on(node,expr,vm,eventName)
    },
    updater:{
        model(node,value){
            
            node.value = value
        },
        text(node,value){

            node.textContent = value
        },
        html(node,value){
            node.innerHTML = value
        },
        on(node,expr,vm,eventName){
            let fn = vm.$methods && vm.$methods[expr]
            node.addEventListener(eventName,fn.bind(vm),false) //将this指向改为vm 使其使用方法时始终指向vue实例
        }
    }
}

class Complie{
    constructor(el,vm){
       this.el =  this.isElementNode(el)?el:document.querySelector(el)
       this.vm = vm
       // 获取文档碎片对象 放入内存中会减少页面的回流和重绘
        const fragment = this.node2Fragment(this.el)
        //编译模板
        this.compile(fragment)
        //追加子元素到根元素上
        this.el.appendChild(fragment)
    }
    compile(fragment){
        //获取到每一个字节点
        const childNodes = fragment.childNodes;
        [...childNodes].forEach(child=>{
            if(this.isElementNode(child)){
                //是元素节点
                //编译元素节点
                this.compileElement(child)
            }else{
                //文本节点
                //编译文本节点
                this.compileText(child)
            }
            if(child.childNodes&&child.childNodes.length){
                this.compile(child)
            }
        })
    }
    compileElement(node){
        const attributes = node.attributes;
        [...attributes].forEach(el=>{
            const {name,value} = el
            if(this.isDirective(name)){//属于vue指令
                const [,dirctive] = name.split('-') // text html model on:click
                
                const [dirctiveName,eventName] = dirctive.split(':')
                //数据更新
                complieUtil[dirctiveName](node,value,this.vm,eventName)

                //删除指令属性
                node.removeAttribute('v-'+dirctive)
            }
        })
    }
    isDirective(attrName){
        return attrName.startsWith('v-')
    }
    compileText(node){

        const textContent = node.textContent
        if(/\{\{(.+?)\}\}/.test(textContent)){
            complieUtil.text(node,textContent,this.vm)
            
            
        }

    }
    node2Fragment(el){
        //创建文档碎片
        const f = document.createDocumentFragment()
        let firstChild
        while(firstChild = el.firstChild){
            f.appendChild(firstChild)
        }

        return f
    }
    isElementNode(node){
        return node.nodeType ===1
    }
}

class MVue{
    constructor(options){
        this.$el = options.el
        this.$data = options.data
        this.$methods = options.methods
        this.$options = this.options
        
        if(this.$el){
            //实现一个观察者
            new Observer(this.$data)
            //实现一个指令的解析器
            new Complie(this.$el,this)
        }
    }
    proxyData(data){
        for(let key in data){
            Object.defineProperty(this,key,{
                get(){
                    return data[key]
                },
                set(value){
                    data[key] = value
                }
            })
        }
    }
}

