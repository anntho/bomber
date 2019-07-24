module.exports = {
    procHandler: (pool, sql, inputs) => {
        return new Promise((res, rej) => {
            pool.query(sql, inputs, (err, results, fields) => {
                if (err) {
                    rej(err);
                } else {
                    res(results[0]);
                }
            });
        });
    },
    procHandler2: (pool, sql, inputs) => {
        return new Promise((res, rej) => {
            pool.query(sql, inputs, (err, results, fields) => {
                if (err) {
                    rej(err);
                } else {
                    res(results);
                }
            });
        });
    }
}