use crate::models::splunk_response::SplunkResponse;
use reqwest::Error;
use reqwest::Response;
use serde::Deserialize;



pub async fn read_orders(url: &str,token: &str) -> Result<SplunkResponse, Error> {
    let client = reqwest::Client::new();
    //let mut url = "".to_string(); // = "https://splunkcloud.intranet.allianz-assistance.com:8089/servicesNS/admin/external_access/search/jobs/export?output_mode=json_rows&search=savedsearch PURCHASE_TEST_GL_V2";
    //let mut token = "".to_string();// ="eyJraWQiOiJzcGx1bmsuc2VjcmV0IiwiYWxnIjoiSFM1MTIiLCJ2ZXIiOiJ2MiIsInR0eXAiOiJzdGF0aWMifQ.eyJpc3MiOiJuaWNvbGFzdCBmcm9tIHNoLWktMDM2ZmI0ZTM4YWYwNTVkNDMiLCJzdWIiOiJuaWNvbGFzdCIsImF1ZCI6IkFEUCBURVNUIiwiaWRwIjoiU3BsdW5rIiwianRpIjoiNzE3ZjVjZmEzYTI5M2IwMTQwODkxZWNlZjliMTBlYTI0OTU1Yjc1NjkyMmRkNDJkOTE5NmUxNjk5YjhhZDFlZSIsImlhdCI6MTczMjY5ODk3OCwiZXhwIjoxNzM3ODgyOTc4LCJuYnIiOjE3MzI2OTg5Nzh9.vkTCCdHhXMmby8gXqdREMADZSOZEuEOCzgc1-xBk4CKcL1n-ITyGoDiFiOsbtA5jzrdNs7dCAxbFxsxi4mP-Xg";

    let response = client
        .get(url)
        .bearer_auth(token)
        .send()
        .await
        .unwrap()
        .json::<SplunkResponse>()
        .await;

    match response {
        Ok(order) => {
            println!("Processing order response");
           // println!("{:?}" , order);
           /* for result in order.result {
                process_order(result);
            }*/
            Ok(order)
        }
        Err(e) => {
            println!("Orders API response cannot be parsed! {}", e);
            Err(e)
        }
    }

}
