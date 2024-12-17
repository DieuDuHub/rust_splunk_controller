use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use actix_files::NamedFile;
use actix_web::HttpRequest;
use std::path::{PathBuf, Path};

use serde::Deserialize;
use serde::Serialize;

mod models;
mod services;
mod tools;

use tools::config::Data;

#[derive(Deserialize, Serialize, Debug)]
pub struct ApiResponse {
    max_policy: i32,
    max_amount: f32,
    markets: Vec<Market>,
}

#[derive(Deserialize,  Serialize,Debug)]
struct Market {
    market_code: String,
    market_policies : i32,
    market_amount : f32,
    saleschannels: Vec<SalesChannel>,
}

#[derive(Deserialize,  Serialize,Debug)]
struct SalesChannel {
    sc_bp: String,
    sc_sc : String,
    sc_policies : i32,
    sc_amount : f32,
}

#[get("/hello")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

async fn index(req: HttpRequest) -> actix_web::Result<NamedFile> {
    let filename: PathBuf = req.match_info().query("filename").parse().unwrap();
    let path = Path::new("./html/").join(filename);
    Ok(NamedFile::open(path)?)
}

async fn process_reponse(sr : Vec<Vec<String>>) -> ApiResponse {
    let mut max_pol = 0;
    let mut max_am = 0.0;
    let mut market_array = Vec::<Market>::new();

    let mut current_market = "".to_string();
    
    let create_sc = |x,y,w:String,z:String | {
        SalesChannel {
            sc_bp : x,
            sc_sc : y,
            sc_policies: w.parse().unwrap(),
            sc_amount: z.parse().unwrap() 
        }
    };

    // Prepare detail list
    for result in sr {
        if result[1] == current_market {
            let temp_sc = create_sc (result[0].clone(), result[2].clone(), result[4].clone(), result[6].clone());
            
            
            market_array.last_mut().unwrap().market_policies += &temp_sc.sc_policies;
            market_array.last_mut().unwrap().market_amount += &temp_sc.sc_amount;

            max_pol += &temp_sc.sc_policies;
            max_am += &temp_sc.sc_amount;

            market_array.last_mut().unwrap().saleschannels.push(temp_sc);
        }
        else {
            // init a new Market
            current_market = result[1].clone();
            let temp_sc = create_sc (result[0].clone(), result[2].clone(), result[4].clone(), result[6].clone());
              
            max_pol += &temp_sc.sc_policies;
            max_am += &temp_sc.sc_amount;

            let temp_market = Market {
                market_code : result[1].clone(),
                market_policies : result[4].parse().unwrap(),
                market_amount : result[6].parse().unwrap(),
                saleschannels : vec![temp_sc]
            };

            market_array.push(temp_market);
        }
    }

    // Sort array by amount
    market_array.sort_by(|a, b| b.market_amount.partial_cmp(&a.market_amount).unwrap());    

    ApiResponse { max_policy : max_pol, max_amount : max_am, markets :market_array}
}

async fn manual_hello(data: web::Data<Data>) -> impl Responder {

    let url = &data.config.url; 
    let token = &data.config.token; 

    match services::splunk_api::read_orders(url,token).await {
        Ok(response) => {
            // filter Splunk reponse and consolidate array
            
            let result = process_reponse(response.rows).await;
            
            HttpResponse::Ok().json(result)
        }
        Err(e) => {
            HttpResponse::InternalServerError().body(format!("Error: {}", e))
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {

    // Load config
    let config : Data = tools::config::init_config("config.toml");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(config.clone()))
            .service(hello)
            .service(echo)
            .route("/splunk", web::get().to(manual_hello))
            .route("/{filename:.*}", web::get().to(index))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}