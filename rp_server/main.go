// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"flag"
	log "github.com/sirupsen/logrus"
	"net/http"
	"fmt"
	"github.com/spf13/viper"
)

func init() {
	viper.SetConfigName("config")                                     // name of config file (without extension)
	viper.AddConfigPath(".")
	err := viper.ReadInConfig()                                          // Find and read the config file
	if err != nil {                                                      // Handle errors reading the config file
		log.Fatalf("Fatal error config file: %s \n", err)
	}
	viper.WatchConfig()
}

var addr = flag.String("addr", ":8080", "http service address")

func serveHome(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL)
	if r.URL.Path != "/" {
		http.Error(w, "Not found", 404)
		return
	}
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", 405)
		return
	}
	http.ServeFile(w, r, "home.html")
}

func main() {

	log.Println(viper.GetInt("live.maxLayers"))

	flag.Parse()
	roomMap := make(map[string]*Hub)
	http.HandleFunc("/", serveHome)
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("Host: %s\n", r.Host)
		r.ParseForm()
		key := r.Form.Get("key")
		room := r.Form.Get("room")
		mode := r.Form.Get("mode")
		if room == "" {
			panic("no room in query string")
			return
		}
		var  hub *Hub
		if key == "free" {
			if roomMap[room] == nil{                                                          //该频道不存在
				log.Printf("create new room %s", room)
				hub = newHub(room, mode)
				roomMap[room] = hub
				hub.P2pConfig.Live.MaxLayers = viper.GetInt("live.maxLayers")
				hub.P2pConfig.Live.MinRPNodes = viper.GetInt("live.minRPNodes")
				hub.P2pConfig.Live.MaxRPNodes = viper.GetInt("live.maxRPNodes")
				hub.P2pConfig.Live.DefaultUploadBW = viper.GetInt64("live.DefaultUploadBW")
				hub.P2pConfig.Live.RPBWThreshold = viper.GetInt64("live.RPBWThreshold")
				hub.P2pConfig.Live.Substreams = viper.GetInt("live.substreams")
				go hub.run()
			} else {
				hub = roomMap[room]
			}
			serveWs(hub, w, r)
		} else {
			w.WriteHeader(http.StatusForbidden)
		}
		//if mode == "vis" {
		//	hub := roomMap[room]
		//	if hub == nil {
		//		w.WriteHeader(http.StatusForbidden)
		//		return
		//	}
		//	log.Printf("66666666")
		//	serveVisWs(hub, w, r)
		//} else {
		//
		//}

	})
	http.HandleFunc("/vis", func(w http.ResponseWriter, r *http.Request) {
		r.ParseForm()
		//log.Printf("Scheme %s", r.URL.Scheme)
		room := r.Form.Get("room")
		if room == "" {
			panic("no room in query string")
			return
		}
		log.Printf("HandleFunc /vis room: %s", room)
		hub := roomMap[room]
		if hub == nil {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		log.Printf("serveVisWs")
		serveVisWs(hub, w, r)
		//log.Printf("serveVisHttp")
		//serveVisHttp(hub, w, r)
	})
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}


}

func setupHub(hub *Hub)  {

}
