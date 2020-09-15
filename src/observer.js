class Watcher{
    constructor(vm,expr,callback){
        this.vm = vm
        this.expr = expr
        this.callback = callback
        //先把旧值保存
        this.oldValue = this.getOldVlaue()
    }
    getOldVlaue(){
        Dep.target = this
        const oldValue = complieUtil.getValue(this.expr,this.vm)
        Dep.target = null
        return oldValue
    }
    update(){
        const newVlaue = complieUtil.getValue(this.expr,this.vm)
        if(newVlaue!==this.oldValue){
            this.callback(newVlaue)
        }
    }
}

class Dep{
    constructor(){
        this.subs = []
    }

    //收集观察者 
    addSub(watcher){
        this.subs.push(watcher)
    }

    notify(){
        this.subs.forEach(w=>w.update())
    }
}


class Observer{
    constructor(data){
        this.observer(data)
    }
    observer(data){
        if(data && typeof data === 'object'){
            Object.entries(data).forEach(([key,value])=>{
                this.defineReactive(data,key,value)
            })
        }
    }
    defineReactive(data,key,value){
        this.observer(value)
        const dep = new Dep()
        Object.defineProperty(data,key,{
            configurable:false,
            enumerable:false,
            get:()=>{
                //订阅数据发生变化时，往dep中添加观察者
                Dep.target && dep.addSub(Dep.target)
                return value
            },
            set:(newVlaue)=>{
                this.observer(newVlaue)
                console.log(111,newVlaue)
                if(newVlaue!==value){
                    value = newVlaue
                    dep.notify()
                }
            }
        })
    }
}