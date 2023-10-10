function getItemIds() {
  var form = FormApp.getActiveForm();
  var items = form.getItems();
  for (var i = 0; i < items.length; i++) {
    Logger.log("Title: " + items[i].getTitle() + ", ID: " + items[i].getId());
  }
}

function onFormSubmit(e) {
  var responses = e.response.getItemResponses();
  var desiredDateStr = responses[0].getResponse(); 
  var name = responses[1].getResponse();
  var phoneNumber = responses[2].getResponse();
  var birthdate = responses[4].getResponse();
  var participants = responses[5].getResponse();
  var email = responses[6].getResponse();
  
  // メール送信に関するコードスニペット
  var emailItemsInfo =
  "名前: " + name + "\n" +
  "予約日: " + desiredDateStr + "\n" +
  "生年月日: " + birthdate + "\n" +
  "参加人数: " + participants + "\n" +
  "電話番号: " + phoneNumber + "\n";

  // メールを送信
  sendEmailNotification(email, emailItemsInfo);

  // "10/20(日) 10:00" を "10/20 10:00" に変換
  var cleanedDateStr = desiredDateStr.replace(/\(.+\)\s*/, " ");

  // 現在の年を取得
  var currentYear = (new Date()).getFullYear();

  // cleanedDateStrに年を追加
  var fullDateStr = currentYear + "/" + cleanedDateStr;

  // 日付オブジェクトを生成
  var desiredDate = new Date(fullDateStr);
  if(isNaN(desiredDate)) {
    // エラーハンドリング: 日付のパースに失敗
    console.error("Failed to parse the date: " + cleanedDateStr);
    return;
  }

  // 2時間後の時間を計算
  var endTime = new Date(desiredDate.getTime() + (2 * 60 * 60 * 1000));

  var calendar = CalendarApp.getCalendarById('kimifull3276@gmail.com');

  // その日に他の予定がないか確認
  var events = calendar.getEvents(desiredDate, endTime);
  //Logger.log("Found " + events.length + " events between " + desiredDate + " and " + endTime); // 追加

  if (events.length === 0) { // 他の予定がなければ
    try {
        var event = calendar.createEvent('石鹸づくり体験予約', desiredDate, endTime, {
          description: emailItemsInfo // 予約の詳細を説明欄に追加
        });
    } catch (e) {
        // イベント作成時のエラーをログに出力
        console.error("Error creating event: " + e.toString());
    }
  } else {
    // 他の予定があるため予約できない。適切なエラーハンドリングを実装する。
    console.error("Unable to schedule an event due to a conflicting event.");
  }
 
 updateFormChoices();
}

function sendEmailNotification(email, emailItemsInfo) {
    var shopEmail = 'kimifull3276@gmail.com';
    var customerSubject = 'ご予約ありがとうございます';
    var url = "https://maps.app.goo.gl/3fp3mWkn83u2THi68"; // お客様をリダイレクトしたいURLを指定してください。

    var customerBody = '【予約内容】'+'\n' +
        emailItemsInfo +'\n' +
        'ご予約ありがとうございます！'+'\n' +
        '当日はこちらまでお越しください↓'+'\n' +url +'\n\n' +
        '駐車場は映画館の方をご利用ください。'+'\n' +
        'お待ちしております！！';



      

    var shopSubject = '新しい予約がありました';
    var shopBody = '【予約内容】'+'\n' +  emailItemsInfo;

    GmailApp.sendEmail(email, customerSubject, customerBody);
    GmailApp.sendEmail(shopEmail, shopSubject, shopBody);
}


function updateFormChoices() {
  var form = FormApp.openById('1nClZWVCvHJYFsT9G1nR3wAV4nywQ38JJvIDqFNybszY');
  var dateItem = form.getItemById('178591823');
  
  if(dateItem.getType() === FormApp.ItemType.LIST) {
    var dateChoice = dateItem.asListItem();
    
    var calendar = CalendarApp.getCalendarById('kimifull3276@gmail.com');
    var now = new Date();
    now.setDate(now.getDate() + 1); // 明日の日付を取得
    var futureDate = new Date(now.getTime());
    futureDate.setDate(futureDate.getDate() + 14); // 2週間後の日付を取得
    
    var choices = [];
    var weekdays = ["日", "月", "火", "水", "木", "金", "土"]; // アプローチ1に必要
    
    for(var day = now; day <= futureDate; day.setDate(day.getDate() + 1)) {
      // 日曜日はスキップ
      if(day.getDay() !== 0) {
        var slots = ['10:00', '13:00', '15:00']; // 予約可能な時間スロット
        
        slots.forEach(function(slot) {
          // 日付と時間スロットを結合して新しい日付オブジェクトを作成
          var currentYear = (new Date()).getFullYear();
          var slotDateStr = Utilities.formatDate(day, 'JST', currentYear + '/MM/dd') + ' ' + slot;
          var slotDate = new Date(slotDateStr);
          var endTime = new Date(slotDate.getTime() + (2 * 60 * 60 * 1000)); // 2時間後

          // その時間に他の予定がないか確認
          var events = calendar.getEvents(slotDate, endTime);
          if(events.length === 0) { // 他の予定がなければ
            var choiceStr = slotDate.toLocaleDateString('ja-JP', {month: '2-digit', day: '2-digit', weekday: 'short'}) + ' ' + slotDate.toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'});

            choices.push(choiceStr);
          }
        });
      }
    }
    
    // フォームの選択肢を更新
    dateChoice.setChoiceValues(choices);
  } else {
    throw new Error('Item type must be LIST.');
  }
}