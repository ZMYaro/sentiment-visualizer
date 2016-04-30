#!/usr/bin/env python
import json
from flask import Flask, request, make_response, render_template, abort
from textblob import TextBlob

app = Flask(__name__)

def get_text(req):
	if req.form:
		return req.form['text']
	elif req.headers['Content-Type'] == 'application/json':
		return req.json['text']
	else:
		abort(404)

@app.route("/")
def main_page():
	return render_template('index.html')

@app.route("/api", methods=['POST'])
def sentiment_api():
	#text = get_text(request)
	#blob = TextBlob(text)
	#sentences = [{"sentence": unicode(s), "sentiment": s.sentiment[0]} for s in blob.sentences]
	json_out = json.dumps([{"text":"This is the first sentence.","sentiment":1},{"text":"This is the second sentence.","sentiment":0.1},{"text":"This is the final sentence","sentiment":-1}])
	resp = make_response(json_out)
	resp.headers['Content-Type'] = 'application/json'
	return resp

if __name__ == '__main__':
	app.run(debug=True)
