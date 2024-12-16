use std::fs;
use std::process::exit;
use toml;
use serde_derive::Deserialize;

#[derive(Deserialize,Clone)]
pub struct Data {
    pub config: Config,
}

#[derive(Deserialize,Clone)]
pub struct Config {
    pub url: String,
    pub token: String,
}

pub fn init_config(filename: &str) -> Data {
    
    let contents = match fs::read_to_string(filename) {
        // If successful return the files text as `contents`.
        // `c` is a local variable.
        Ok(c) => c,
        // Handle the `error` case.
        Err(_) => {
            // Write `msg` to `stderr`.
            eprintln!("Could not read file `{}`", filename);
            // Exit the program with exit code `1`.
            exit(1);
        }
    };

    // Use a `match` block to return the 
    // file `contents` as a `Data struct: Ok(d)`
    // or handle any `errors: Err(_)`.
    let data: Data = match toml::from_str(&contents) {
        // If successful, return data as `Data` struct.
        // `d` is a local variable.
        Ok(d) => d,
        // Handle the `error` case.
        Err(_) => {
            // Write `msg` to `stderr`.
            eprintln!("Unable to load data from `{}`", filename);
            // Exit the program with exit code `1`.
            exit(1);
        }
    };

    data
}