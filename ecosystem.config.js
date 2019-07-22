module.exports = {
	apps : [{
		name: "http",
		script: "www",
		cwd: "/var/www/http/bin",
		instances: 1,
		watch: true,
		max_memory_restart: "1G",
		env: {
	  		"NODE_ENV": "development",
		},
		env_production : {
	   		"NODE_ENV": "production"
		},
		log_date_format: "YYYY-MM-DD HH:mm",
		error_file: "/var/www/https.log",
		out_file: "/var/www/https.log",
		merge_logs: true,
		min_uptime: "1m",
		max_restarts: 2
  	}, {
  		name: "https",
		script: "www",
		cwd: "/var/www/https/bin",
		instances: 1,
		watch: true,
		max_memory_restart: "1G",
		env: {
	  		"NODE_ENV": "development",
		},
		env_production : {
	   		"NODE_ENV": "production"
		},
		log_date_format: "YYYY-MM-DD HH:mm",
		error_file: "/var/www/https.log",
		out_file: "/var/www/https.log",
		merge_logs: true,
		min_uptime: "1m",
		max_restarts: 2
	}]
}