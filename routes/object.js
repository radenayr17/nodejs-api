const express = require('express');
const squel = require('squel');
const router = express.Router();

const db = require('../db');

const getObjectLatestData = (key,callback) =>{
    try{
        const query = squel.select().from('object').where(`field = '${key}'`).order('timestamp',false).limit(1).toString();

        db.query(query,function(err,data){
            if(err){
                console.error('Error:',err);

                const error = 'Server error';

                callback(error);
            }else{
                if(data && data.length){
                    const item = data[0];
                    const response = {
                        id:item.id,
                        key:item.field,
                        value:item.value,
                        timestamp:item.timestamp
                    }

                    callback(null,response);
                }else{
                    const error = 'Data not found';

                    callback(error);
                }
            }
        });
    }catch(err){
        console.error('Error:',err);

        const error = err.message;

        callback(error);
    }
}

const getObjectVersionData = (key,timestamp,callback) =>{
    try{
        const query = squel.select()
                            .from('object')
                            .where(`field = '${key}'`)
                            .where(`timestamp <= ${timestamp}`)
                            .order('timestamp',false)
                            .limit(1)
                            .toString();

        db.query(query,function(err,data){
            if(err){
                console.error('Error:',err);

                const error = 'Server error';

                callback(error);
            }else{
                if(data && data.length){
                    const item = data[0];
                    const response = {
                        id:item.id,
                        key:item.field,
                        value:item.value,
                        timestamp:item.timestamp
                    }

                    callback(null,response);
                }else{
                    /* no data found in given timestamp, return the latest value */
                    getObjectLatestData(key,function(err,res){
                        if(err){
                            callback(err);
                        }else{
                            callback(null,res);
                        }
                    });
                }
            }
        });
    }catch(err){
        console.error('Error:',err);

        const error = err.message;

        callback(error);
    }
}

const addObjectData = (insert,callback) =>{
    try{
        const param = [insert];
        const query = squel.insert().into('object').setFieldsRows(param).toString();

        db.query(query,function(err,data){
            if(err){
                console.error('Error:',err);

                const error = 'Server error';

                callback(error);
            }else{
                insert.id = data.insertId;

                callback(null,insert);
            }
        });
    }catch(err){
        console.error('Error:',err);

        const error = err.message;

        callback(error);
    }
}

router.post('/',function(req,res){
    const post = req.body;
    const keys = Object.keys(post);

    const date = new Date();
    const key = keys[0];
    const value = post[key];

    if(key && value){
        const data = {
            field:key,
            value:value,
            timestamp:date.getTime()
        }

        addObjectData(data,function(err,object){
            if(err){
                res.json({message:err});
            }else{
                const response = {
                    key:object.field,
                    value:object.value,
                    timestamp:object.timestamp
                }

                res.json(response);
            }
        });
    }else{
        res.json({message:"Missing required parameters"});
    }
});

router.get('/:key',function(req,res){
    const key = req.params.key;
    const query = req.query;

    if(key){
        const timestamp = query.timestamp;

        if(timestamp){
            if(isNaN(timestamp)){
                res.json({message:"Invalid parameter"});
            }else{
                const time = parseFloat(timestamp);

                getObjectVersionData(key,time,function(err,data){
                    if(err){
                        res.json({message:err});
                    }else{
                        res.json({value:data.value});
                    }
                });
            }
        }else{
            getObjectLatestData(key,function(err,data){
                if(err){
                    res.json({message:err});
                }else{
                    res.json({value:data.value});
                }
            });
        }
    }else{
        res.json({message:"Missing required parameters"});
    }
});

module.exports = router;