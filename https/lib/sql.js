module.exports = {
    procHandler: (pool, sql, inputs) => {
        return new Promise((res, rej) => {
            pool.query(sql, inputs, (err, results) => {
                if (err) {
                    rej(err);
                } else {
                    // this can be probematic 
                    // as any selects in place of "sets" in the proc will return rubbish first 
                    // and move the index out of place
                    res(results[0]);
                }
            });
        });
    },
    procHandler2: (pool, sql, inputs) => {
        return new Promise((res, rej) => {
            pool.query(sql, inputs, (err, results) => {
                if (err) {
                    rej(err);
                } else {
                    res(results);
                }
            });
        });
    }
}