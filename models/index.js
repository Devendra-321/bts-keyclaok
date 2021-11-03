"use strict";

const User = require('./User');
const Category = require('./Category');
const SubCategory = require('./SubCategory');
const Allergy = require('./Allergy');
const Spice = require('./Spice');
const Calorie = require('./Calorie');
const FoodType = require('./FoodType');
const Item = require('./Item');
const FilterType = require('./FilterType');
const FilterData = require('./FilterData');
const HourDiscount = require('./HourDiscount');
const DayDiscount = require('./DayDiscount');
const DiscountCard = require('./DiscountCard');
const OrderValue = require('./OrderValue');
const OrderDiscount = require('./OrderDiscount');
const ServiceCharge = require('./ServiceCharge');
const DeliveryCharge = require('./DeliveryCharge');
const Option = require('./Option');
const OptionAttribute = require('./OptionAttribute');
const CheckoutFacility = require('./CheckoutFacility');
const DiscountCategory = require('./DiscountCategory');
const DaySchedule = require('./DaySchedule');
const Cart = require('./Cart');
const PaymentGateway = require('./PaymentGateway');
const Order = require('./Order');
const UserDiscountCode = require('./UserDiscountCode');
const UserDiscountCard = require('./UserDiscountCard');
const DeliveryChargesType = require('./DeliveryChargesType');
const Review = require('./Review');
const Branch = require('./Branch');
const CateringEnquiry = require('./CateringEnquiry');
const Flag = require('./Flag');
const Config = require('./Config');

module.exports = {
  User: User,
  Category: Category,
  SubCategory: SubCategory,
  Allergy: Allergy,
  Spice: Spice,
  Calorie: Calorie,
  FoodType: FoodType,
  Item: Item,
  FilterType: FilterType,
  FilterData: FilterData,
  HourDiscount: HourDiscount,
  DayDiscount: DayDiscount,
  DiscountCard: DiscountCard,
  OrderValue: OrderValue,
  OrderDiscount: OrderDiscount,
  ServiceCharge: ServiceCharge,
  DeliveryCharge: DeliveryCharge,
  Option: Option,
  OptionAttribute: OptionAttribute,
  CheckoutFacility: CheckoutFacility,
  DiscountCategory: DiscountCategory,
  DaySchedule: DaySchedule,
  Cart: Cart,
  PaymentGateway: PaymentGateway,
  Order: Order,
  UserDiscountCode: UserDiscountCode,
  UserDiscountCard: UserDiscountCard,
  DeliveryChargesType: DeliveryChargesType,
  Review: Review,
  Branch: Branch,
  CateringEnquiry: CateringEnquiry,
  Flag: Flag,
  Config: Config
};
