use serde::Deserialize;
use serde::Serialize;

#[derive(Deserialize, Serialize, Debug)]
pub struct SplunkResponse {
    preview: bool,
    init_offset: i32,
    messages: Vec<Message>,
    fields: Vec<String>,
    pub rows: Vec<Vec<String>>,
}

#[derive(Deserialize,  Serialize,Debug)]
struct Message {
    #[serde(rename = "type")]
    message_type: String,
    text: String,
}