import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Globe, 
  Zap, 
  ArrowRight,
  BarChart3,
  Shield,
  Smartphone,
  Target,
  Building2,
  CheckCircle
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function InvestorsAr() {
  return (
    <div className="min-h-screen bg-white text-right" dir="rtl">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-[hsl(249,83%,65%)] ml-3" />
              <span className="text-2xl font-bold">bpay</span>
              <Badge className="mr-3 bg-green-100 text-green-700 border-green-200">منصة مباشرة</Badge>
            </div>
            <div className="hidden md:flex items-center space-x-8 space-x-reverse">
              <a href="/ar" className="text-gray-600 hover:text-gray-900 transition-colors">الرئيسية</a>
              <a href="/addon-checkout-demo" className="text-gray-600 hover:text-gray-900 transition-colors">تجربة التاجر</a>
              <Button onClick={() => window.location.href = "/api/login"} className="bg-[hsl(249,83%,65%)] text-white hover:bg-[hsl(249,83%,60%)]">
                تسجيل الدخول
              </Button>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-20 pb-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-[hsl(249,83%,65%)]/10 text-[hsl(249,83%,65%)] border-[hsl(249,83%,65%)]/20">
            للمستثمرين
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            ثورة مدفوعات بقيمة <span className="text-[hsl(249,83%,65%)]">78 مليار دولار</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            bpay تعيد تعريف معالجة المدفوعات من خلال تقسيم المدفوعات الذكي عبر مصادر تمويل متعددة، تخدم السوق سريع النمو بمعدل نمو سنوي مركب قدره 12.7%.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = "mailto:investors@getbpay.com"}
              className="bg-[hsl(249,83%,65%)] text-white hover:bg-[hsl(249,83%,60%)] px-10 py-4 text-lg font-semibold shadow-xl"
            >
              طلب مذكرة المعلومات
              <ArrowRight className="mr-2 h-5 w-5 rotate-180" />
            </Button>
            <Button 
              size="lg"
              onClick={() => window.location.href = "/banner-checkout-demo"}
              className="border-2 border-[hsl(249,83%,65%)] text-[hsl(249,83%,65%)] bg-transparent hover:bg-[hsl(249,83%,65%)] hover:text-white px-10 py-4 text-lg font-semibold"
            >
              مشاهدة المنصة المباشرة
            </Button>
          </div>
        </div>
      </div>

      {/* Market Opportunity */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700">فرصة السوق</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              سوق ضخم، حل مبتكر
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              معالجة المدفوعات العالمية تنمو بسرعة، و bpay يحتل موقعاً فريداً لالتقاط حصة كبيرة من هذا النمو.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-gradient-to-r from-[hsl(249,83%,65%)] to-[hsl(186,94%,44%)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="text-white h-8 w-8" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">78 مليار دولار</h3>
                <p className="text-gray-600">حجم السوق العالمي لمعالجة المدفوعات</p>
              </CardContent>
            </Card>
            
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-gradient-to-r from-[hsl(186,94%,44%)] to-[hsl(258,70%,68%)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="text-white h-8 w-8" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">12.7%</h3>
                <p className="text-gray-600">معدل النمو السنوي المركب للسوق</p>
              </CardContent>
            </Card>
            
            <Card className="p-8 text-center hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-gradient-to-r from-[hsl(258,70%,68%)] to-[hsl(249,83%,65%)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="text-white h-8 w-8" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">2.8 مليار دولار</h3>
                <p className="text-gray-600">السوق القابل للعنونة بحلول 2028</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Business Model */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700">نموذج الأعمال</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              إيرادات متعددة المصادر
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              نموذج هجين يجمع بين الاشتراكات ورسوم المعاملات لنمو مستدام وقابل للتوسع.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">مصادر الإيرادات</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <CheckCircle className="text-green-500 h-6 w-6 mt-1 ml-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">رسوم الاشتراك الشهري</h4>
                    <p className="text-gray-600">خطط مستويات متعددة: مجاني، احترافي (9.99$)، بريميوم (19.99$)</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="text-green-500 h-6 w-6 mt-1 ml-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">رسوم المعاملات</h4>
                    <p className="text-gray-600">2.9% للمجاني/احترافي، 1.9% للبريميوم - تنافسية مع Stripe</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="text-green-500 h-6 w-6 mt-1 ml-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">رسوم API للمؤسسات</h4>
                    <p className="text-gray-600">حلول مخصصة للتجار الكبار والمؤسسات</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Card className="p-8 bg-gradient-to-br from-[hsl(249,83%,65%)] to-[hsl(186,94%,44%)] text-white">
              <CardContent className="p-0">
                <h3 className="text-2xl font-bold mb-6">مقاييس الإيرادات المتوقعة</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>2025 (السنة الأولى)</span>
                    <span className="font-bold">500 ألف دولار</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>2026 (السنة الثانية)</span>
                    <span className="font-bold">2.5 مليون دولار</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>2027 (السنة الثالثة)</span>
                    <span className="font-bold">8.5 مليون دولار</span>
                  </div>
                  <div className="border-t border-white/20 pt-4 mt-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>إجمالي إيرادات 3 سنوات</span>
                      <span>11.5 مليون دولار</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700">المقاييس الرئيسية</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              نمو مثبت ومستمر
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              مقاييس قوية تُظهر قوة جذب السوق وإمكانات النمو في صناعة معالجة المدفوعات.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="p-6 text-center border-t-4 border-[hsl(249,83%,65%)] hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <Users className="h-8 w-8 text-[hsl(249,83%,65%)] mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-gray-900 mb-2">12,000+</h3>
                <p className="text-gray-600">مستخدم نشط</p>
                <div className="mt-2 text-sm text-green-600 font-semibold">+45% نمو شهري</div>
              </CardContent>
            </Card>
            
            <Card className="p-6 text-center border-t-4 border-[hsl(186,94%,44%)] hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <DollarSign className="h-8 w-8 text-[hsl(186,94%,44%)] mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-gray-900 mb-2">2.5 مليون دولار+</h3>
                <p className="text-gray-600">حجم المعاملات المعالجة</p>
                <div className="mt-2 text-sm text-green-600 font-semibold">+85% نمو ربع سنوي</div>
              </CardContent>
            </Card>
            
            <Card className="p-6 text-center border-t-4 border-[hsl(258,70%,68%)] hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <Building2 className="h-8 w-8 text-[hsl(258,70%,68%)] mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-gray-900 mb-2">500+</h3>
                <p className="text-gray-600">تكامل تاجر</p>
                <div className="mt-2 text-sm text-green-600 font-semibold">+30% نمو شهري</div>
              </CardContent>
            </Card>
            
            <Card className="p-6 text-center border-t-4 border-green-500 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <BarChart3 className="h-8 w-8 text-green-500 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-gray-900 mb-2">92%</h3>
                <p className="text-gray-600">معدل الاحتفاظ بالمستخدمين</p>
                <div className="mt-2 text-sm text-blue-600 font-semibold">أفضل من المعيار الصناعي</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Competitive Advantage */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-orange-100 text-orange-700">الميزة التنافسية</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              لماذا bpay ستهيمن على السوق
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              حلول مبتكرة تحل المشاكل الحقيقية في النظام البيئي للمدفوعات الحديثة.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gradient-to-r from-[hsl(249,83%,65%)] to-[hsl(186,94%,44%)] rounded-lg flex items-center justify-center mb-6">
                  <Zap className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">أول حل تقسيم ذكي</h3>
                <p className="text-gray-600 leading-relaxed">
                  خوارزميات حصرية تحسن تقسيم المدفوعات عبر مصادر تمويل متعددة، مما يزيد من المكافآت ويقلل الرسوم.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gradient-to-r from-[hsl(186,94%,44%)] to-[hsl(258,70%,68%)] rounded-lg flex items-center justify-center mb-6">
                  <Shield className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">أمان مصرفي المستوى</h3>
                <p className="text-gray-600 leading-relaxed">
                  امتثال SOC 2 Type II و PCI DSS مع تشفير من الطرف إلى الطرف وحماية متقدمة من الاحتيال.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-gradient-to-r from-[hsl(258,70%,68%)] to-[hsl(249,83%,65%)] rounded-lg flex items-center justify-center mb-6">
                  <Smartphone className="text-white h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">تجربة سلسة</h3>
                <p className="text-gray-600 leading-relaxed">
                  إعداد بنقرة واحدة، معالجة فورية، وتكامل سهل مع أكثر من 500 منصة تجارة إلكترونية.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Investment Opportunity */}
      <div className="py-20 bg-gradient-to-r from-[hsl(249,83%,65%)] to-[hsl(186,94%,44%)] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            جاهز لتكون جزءاً من المستقبل؟
          </h2>
          <p className="text-xl mb-12 text-blue-50">
            انضم للمستثمرين الذين يدعمون الجيل التالي من تكنولوجيا المدفوعات.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = "mailto:investors@getbpay.com"}
              className="bg-white text-[hsl(249,83%,65%)] hover:bg-gray-50 px-10 py-4 text-lg font-semibold shadow-xl"
            >
              طلب مذكرة المعلومات التفصيلية
              <ArrowRight className="mr-2 h-5 w-5 rotate-180" />
            </Button>
            <Button 
              size="lg"
              onClick={() => window.location.href = "/banner-checkout-demo"}
              className="border-2 border-white text-white hover:bg-white hover:text-[hsl(249,83%,65%)] backdrop-blur-sm px-10 py-4 text-lg font-semibold"
            >
              استكشف المنصة
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Zap className="h-8 w-8 text-[hsl(249,83%,65%)] ml-3" />
              <span className="text-2xl font-bold">bpay</span>
            </div>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              منصة الدفع الذكية التي تثور كيفية تقسيم المدفوعات عبر مصادر تمويل متعددة.
            </p>
            <div className="flex justify-center space-x-6 space-x-reverse mb-8">
              <a href="mailto:investors@getbpay.com" className="text-gray-300 hover:text-white transition-colors">
                📧 investors@getbpay.com
              </a>
              <a href="tel:+15513758915" className="text-gray-300 hover:text-white transition-colors">
                📞 +1 (551) 375-8915
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 B Ventures LLC. جميع الحقوق محفوظة. مبني بالبنية التحتية المالية الحديثة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}