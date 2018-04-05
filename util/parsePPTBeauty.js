const cheerio = require('cheerio');
const async = require('async');
const express = require('express');
const request = require('request');
const pptBeauty = {
    getTopPages(callback){
        request('https://www.ptt.cc/bbs/Beauty/index.html', (err, res, body) => {
            var $ = cheerio.load(body)
            var prev = $('.btn-group-paging a').eq(1).attr('href').match(/\d+/)[0]
            callback(['', prev, prev - 1])
        })
    },
    getPosts(page, callback){
        request(`https://www.ptt.cc/bbs/Beauty/index${page}.html`, (err, res, body) => {
            var $ = cheerio.load(body)
            var posts = $('.r-ent a').map((index, obj) => {
            return $(obj).attr('href')
            }).get()
            callback(posts)
        })
    },
    getImages(post, callback){
        request('https://www.ptt.cc' + post, (err, res, body) => {
            var images = body.match(/imgur.com\/[0-9a-zA-Z]{7}/g);
            images = [ ...new Set(images) ]
            callback(images);
        })
    }
}


module.exports = pptBeauty;